// POST /api/audit/ci  — CI-friendly endpoint.
//
// Auth model: long-lived opaque token in `X-DSB-CI-Token` header (created via
// /api/ci-tokens). We hash the token and look up the owning user via a
// SECURITY DEFINER function. Falls back to Bearer (user JWT) for local testing.
//
// Body: { repo: "owner/name", branch?: string, github_pat?: string,
//         tokens: DesignTokens, use_ai?: boolean }
// Returns: { summary, findings, fail }  fail = true if any critical.

import { NextResponse, type NextRequest } from "next/server"
import { createHash } from "node:crypto"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { requireUser } from "@/lib/supabase/server"
import { runAudit } from "@/lib/audit/runner"
import { rateLimitOrDeny, LIMITS } from "@/lib/security/rateLimit"

export const dynamic = "force-dynamic"
export const maxDuration = 120

interface CiCaller { supabase: SupabaseClient; userId: string }

async function resolveCiToken(token: string): Promise<CiCaller | null> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supaUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supaUrl) {
    console.error("[audit/ci] SUPABASE_SERVICE_ROLE_KEY missing — CI auth unavailable")
    return null
  }
  const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } })
  const hash = createHash("sha256").update(token).digest("hex")
  const { data: userId } = await admin.rpc("resolve_ci_token", { token_hash: hash })
  if (!userId) return null
  // Bump last_used_at (best-effort).
  admin.from("ci_tokens").update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", hash).then(() => {}, () => {})
  return { supabase: admin, userId }
}

async function authenticate(req: NextRequest): Promise<CiCaller | null> {
  const ci = req.headers.get("x-dsb-ci-token")
  if (ci && /^dsb_ci_[A-Za-z0-9_-]+$/.test(ci)) return resolveCiToken(ci)
  // Fallback: Bearer JWT (local development).
  const u = await requireUser(req)
  if ("error" in u) return null
  return { supabase: u.supabase, userId: u.user.id }
}

export async function POST(req: NextRequest) {
  const caller = await authenticate(req)
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const denied = rateLimitOrDeny(`audit-ci:${caller.userId}`, LIMITS.audit)
  if (denied) return denied

  const { supabase, userId } = caller
  const body = await req.json()
  const { repo, branch = "main", github_pat, tokens, use_ai = false } = body
  if (!repo || !tokens) return NextResponse.json({ error: "repo + tokens required" }, { status: 400 })
  const m = String(repo).match(/^([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)$/)
  if (!m) return NextResponse.json({ error: "repo must be owner/name" }, { status: 400 })
  if (!/^[A-Za-z0-9._/-]{1,128}$/.test(branch))
    return NextResponse.json({ error: "bad_branch" }, { status: 400 })

  const { data: tracked } = await supabase.from("tracked_repos")
    .select("*").eq("owner", m[1]).eq("repo", m[2]).eq("user_id", userId).maybeSingle()
  if (!tracked) {
    return NextResponse.json(
      { error: "repo_not_tracked", hint: "Register the repo under /adoption first." },
      { status: 403 }
    )
  }

  try {
    const out = await runAudit(supabase, {
      userId,
      tokens, use_ai, trigger: "ci",
      repos: [{
        id: tracked.id,
        owner: m[1], repo: m[2], default_branch: branch,
        team: tracked.team, pat: github_pat, label: `${m[1]}/${m[2]}`,
      }],
      figmaFiles: [],
    })
    const fail = out.summary.critical > 0
    return NextResponse.json({ ...out, fail }, { status: fail ? 422 : 200 })
  } catch (e) {
    console.error("[audit/ci]", e)
    return NextResponse.json({ error: "audit_failed" }, { status: 500 })
  }
}
