// POST /api/audit/run
// Body: {
//   tokens: DesignTokens,
//   use_ai?: boolean,
//   trigger?: "manual" | "ci" | "scheduled",
//   repos?: [{ id, github_pat? }],     // ids from tracked_repos
//   figmaFiles?: [{ id, figma_token? }] // ids from tracked_figma_files
//   knownComponents?: string[]
// }
import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"
import { runAudit } from "@/lib/audit/runner"
import { rateLimitOrDeny, LIMITS } from "@/lib/security/rateLimit"

export const dynamic = "force-dynamic"
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth

  const denied = rateLimitOrDeny(`audit:${user.id}`, LIMITS.audit)
  if (denied) return denied

  const body = await req.json()
  const { tokens, use_ai = false, trigger = "manual", knownComponents = [] } = body
  if (!tokens) return NextResponse.json({ error: "tokens required" }, { status: 400 })

  // Hydrate repos
  const repoIds: string[] = (body.repos ?? []).map((r: { id: string }) => r.id).filter(Boolean)
  const figmaIds: string[] = (body.figmaFiles ?? []).map((r: { id: string }) => r.id).filter(Boolean)
  const patMap = Object.fromEntries((body.repos ?? []).map((r: { id: string; github_pat?: string }) => [r.id, r.github_pat]))
  const figTokenMap = Object.fromEntries((body.figmaFiles ?? []).map((r: { id: string; figma_token?: string }) => [r.id, r.figma_token]))

  const [reposRes, filesRes] = await Promise.all([
    repoIds.length ? supabase.from("tracked_repos").select("*").in("id", repoIds) : { data: [] },
    figmaIds.length ? supabase.from("tracked_figma_files").select("*").in("id", figmaIds) : { data: [] },
  ])

  try {
    const out = await runAudit(supabase, {
      userId: user.id,
      tokens,
      use_ai,
      trigger,
      knownComponents,
      repos: (reposRes.data ?? []).map((r) => ({
        id: r.id, owner: r.owner, repo: r.repo, default_branch: r.default_branch,
        team: r.team, pat: patMap[r.id], label: `${r.owner}/${r.repo}`,
      })),
      figmaFiles: (filesRes.data ?? []).map((f) => ({
        id: f.id, file_key: f.file_key, file_name: f.file_name, team: f.team,
        token: figTokenMap[f.id], label: f.file_name ?? f.file_key,
      })),
    })
    return NextResponse.json(out)
  } catch (e) {
    console.error("[audit/run]", e)
    return NextResponse.json({ error: "audit_failed" }, { status: 500 })
  }
}
