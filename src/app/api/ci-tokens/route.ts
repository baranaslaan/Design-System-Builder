// CI token management. Replaces the practice of pasting Supabase user JWTs
// (or service_role keys) into GitHub Actions secrets.
//
//   POST   /api/ci-tokens   { label }     → { token } shown ONCE
//   GET    /api/ci-tokens                  → list (no plaintext)
//   DELETE /api/ci-tokens?id=<uuid>        → revoke

import { NextResponse, type NextRequest } from "next/server"
import { createHash, randomBytes } from "node:crypto"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function newToken(): { plaintext: string; hash: string } {
  // 32 random bytes → 43-char url-safe base64. Prefixed for grep/leak detection.
  const raw = randomBytes(32).toString("base64").replace(/[+/=]/g, c => c === "+" ? "-" : c === "/" ? "_" : "")
  const plaintext = `dsb_ci_${raw}`
  const hash = createHash("sha256").update(plaintext).digest("hex")
  return { plaintext, hash }
}

export async function GET(req: NextRequest) {
  const u = await requireUser(req)
  if ("error" in u) return NextResponse.json({ error: u.error }, { status: u.status })
  const { data, error } = await u.supabase.from("ci_tokens")
    .select("id, label, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: "list_failed" }, { status: 400 })
  return NextResponse.json({ tokens: data ?? [] })
}

export async function POST(req: NextRequest) {
  const u = await requireUser(req)
  if ("error" in u) return NextResponse.json({ error: u.error }, { status: u.status })
  const { label } = await req.json()
  if (typeof label !== "string" || !/^[\w .-]{1,60}$/.test(label))
    return NextResponse.json({ error: "invalid_label" }, { status: 400 })

  const { plaintext, hash } = newToken()
  const { error } = await u.supabase.from("ci_tokens").insert({
    user_id: u.user.id, token_hash: hash, label,
  })
  if (error) return NextResponse.json({ error: "create_failed" }, { status: 400 })

  // Plaintext is returned once — never persisted, never logged.
  return NextResponse.json({ token: plaintext, label })
}

export async function DELETE(req: NextRequest) {
  const u = await requireUser(req)
  if ("error" in u) return NextResponse.json({ error: u.error }, { status: u.status })
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 })
  const { error } = await u.supabase.from("ci_tokens")
    .update({ revoked_at: new Date().toISOString() }).eq("id", id)
  if (error) return NextResponse.json({ error: "revoke_failed" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
