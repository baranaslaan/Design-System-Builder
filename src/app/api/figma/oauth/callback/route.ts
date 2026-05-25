import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { COOKIE_STATE, exchangeCodeForToken, getRedirectUri } from "@/lib/figma/oauth"
import { encryptString } from "@/lib/security/crypto"

export const dynamic = "force-dynamic"

// Callback is invoked by Figma redirecting the browser with ?code&state. We
// can't use the user's JWT here (no Authorization header on top-level nav),
// so we trust the user_id embedded in `state` — that pairing is safe because
// the second half of state matched the nonce cookie we set in /start, which
// itself was issued only to a Bearer-authenticated caller.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state") ?? ""
  const cookieNonce = req.cookies.get(COOKIE_STATE)?.value

  const [userIdRaw, stateNonce] = state.split(".")
  if (!code || !cookieNonce || !stateNonce || stateNonce !== cookieNonce) {
    return NextResponse.redirect(new URL("/?figma=error&reason=state", url.origin))
  }
  if (!/^[0-9a-f-]{36}$/i.test(userIdRaw ?? "")) {
    return NextResponse.redirect(new URL("/?figma=error&reason=state", url.origin))
  }

  try {
    const token = await exchangeCodeForToken(code, getRedirectUri(url.origin))

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supaUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supaUrl) {
      console.error("[figma/callback] SUPABASE_SERVICE_ROLE_KEY missing")
      return NextResponse.redirect(new URL("/?figma=error&reason=server", url.origin))
    }
    const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } })

    const refresh_token_enc = encryptString(token.refresh_token)
    const access_token_enc  = encryptString(token.access_token)
    const access_expires_at = new Date(Date.now() + Math.max(60, token.expires_in - 60) * 1000).toISOString()

    const { error } = await admin.from("figma_user_tokens").upsert({
      user_id: userIdRaw,
      refresh_token_enc, access_token_enc, access_expires_at,
      figma_user_id: token.user_id ?? null,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      console.error("[figma/callback] upsert failed", error.message)
      return NextResponse.redirect(new URL("/?figma=error&reason=server", url.origin))
    }

    const res = NextResponse.redirect(new URL("/?figma=connected", url.origin))
    res.cookies.delete(COOKIE_STATE)
    return res
  } catch (e) {
    console.error("[figma/callback]", e)
    // Generic reason — never reflect upstream error text into the URL.
    return NextResponse.redirect(new URL("/?figma=error&reason=exchange", url.origin))
  }
}
