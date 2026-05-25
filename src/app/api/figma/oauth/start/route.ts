import { NextResponse, type NextRequest } from "next/server"
import {
  FIGMA_AUTH_URL, FIGMA_SCOPES, COOKIE_STATE,
  getClientCreds, getRedirectUri, randomState,
} from "@/lib/figma/oauth"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// State now binds the OAuth round-trip to a specific Supabase user, so the
// callback row lands on the same account regardless of who else might use the
// browser later.
export async function GET(req: NextRequest) {
  const u = await requireUser(req)
  if ("error" in u) return NextResponse.json({ error: u.error }, { status: u.status })

  const { id } = getClientCreds()
  const origin = new URL(req.url).origin
  const redirectUri = getRedirectUri(origin)
  const nonce = randomState()
  const state = `${u.user.id}.${nonce}`

  const url = new URL(FIGMA_AUTH_URL)
  url.searchParams.set("client_id", id)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("scope", FIGMA_SCOPES)
  url.searchParams.set("state", state)
  url.searchParams.set("response_type", "code")

  const res = NextResponse.json({ url: url.toString() })
  res.cookies.set(COOKIE_STATE, nonce, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 10,
  })
  return res
}
