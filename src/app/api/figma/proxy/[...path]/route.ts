// Server-side proxy to api.figma.com — token is loaded from figma_user_tokens
// keyed by the calling Supabase user. No more cross-user cookie inheritance.

import { NextResponse, type NextRequest } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { refreshAccessToken } from "@/lib/figma/oauth"
import { requireUser } from "@/lib/supabase/server"
import { encryptString, decryptString } from "@/lib/security/crypto"

export const dynamic = "force-dynamic"

const FIGMA_API = "https://api.figma.com"

const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/
const ALLOWED_GET = [
  /^v1\/me$/,
  /^v1\/files\/[A-Za-z0-9]{6,64}$/,
  /^v1\/files\/[A-Za-z0-9]{6,64}\/(variables\/local|components|styles|nodes)$/,
  /^v1\/teams\/[A-Za-z0-9]+\/projects$/,
]
const ALLOWED_POST = [
  /^v1\/files\/[A-Za-z0-9]{6,64}\/variables$/,
]

async function loadAccessToken(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("figma_user_tokens")
    .select("refresh_token_enc, access_token_enc, access_expires_at")
    .eq("user_id", userId).maybeSingle()
  if (!data) return null

  const stillValid = data.access_token_enc && data.access_expires_at &&
    new Date(data.access_expires_at).getTime() > Date.now() + 30_000
  if (stillValid) return decryptString(data.access_token_enc as string)

  // Refresh
  try {
    const refresh = decryptString(data.refresh_token_enc as string)
    const t = await refreshAccessToken(refresh)
    await supabase.from("figma_user_tokens").update({
      access_token_enc:  encryptString(t.access_token),
      refresh_token_enc: encryptString(t.refresh_token),
      access_expires_at: new Date(Date.now() + Math.max(60, t.expires_in - 60) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId)
    return t.access_token
  } catch (e) {
    console.error("[figma/proxy] refresh failed", e)
    return null
  }
}

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const u = await requireUser(req)
  if ("error" in u) return NextResponse.json({ error: u.error }, { status: u.status })

  const { path } = await ctx.params
  if (!Array.isArray(path) || path.length === 0)
    return NextResponse.json({ error: "bad_path" }, { status: 400 })
  for (const seg of path) {
    if (typeof seg !== "string" || !SAFE_SEGMENT.test(seg))
      return NextResponse.json({ error: "bad_path" }, { status: 400 })
  }
  const joined = path.join("/")
  const method = req.method
  const allow =
    method === "GET"  ? ALLOWED_GET.some(r => r.test(joined)) :
    method === "POST" ? ALLOWED_POST.some(r => r.test(joined)) :
    false
  if (!allow) return NextResponse.json({ error: "not_allowed" }, { status: 403 })

  const accessToken = await loadAccessToken(u.supabase, u.user.id)
  if (!accessToken) return NextResponse.json({ error: "not_connected" }, { status: 401 })

  const url = new URL(req.url)
  const target = `${FIGMA_API}/${joined}${url.search}`

  const init: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
  }
  if (method !== "GET" && method !== "HEAD") {
    init.body = await req.text()
    ;(init.headers as Record<string, string>)["Content-Type"] = req.headers.get("content-type") ?? "application/json"
  }

  const upstream = await fetch(target, init)
  const body = await upstream.text()
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  })
}

export const GET  = handle
export const POST = handle
