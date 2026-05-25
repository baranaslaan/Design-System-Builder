// POST /api/adoption/scan
// Body: { kind: "github" | "figma", target_id, github_pat?, figma_token?, known_components?: string[] }
import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"
import { scanGithubRepo } from "@/lib/adoption/scanGithub"
import { scanFigmaFile } from "@/lib/adoption/scanFigma"
import { writeDailySnapshot } from "@/lib/adoption/snapshot"
import { rateLimitOrDeny, LIMITS } from "@/lib/security/rateLimit"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth

  const denied = rateLimitOrDeny(`scan:${user.id}`, LIMITS.scan)
  if (denied) return denied

  const body = await req.json()
  const { kind, target_id } = body
  if (!kind || !target_id) return NextResponse.json({ error: "kind+target_id required" }, { status: 400 })

  const { data: scan } = await supabase
    .from("scan_runs")
    .insert({ user_id: user.id, kind, target_id, status: "running" })
    .select().single()
  if (!scan) return NextResponse.json({ error: "scan_run insert failed" }, { status: 500 })

  try {
    let filesScanned = 0
    let componentsSeen = 0
    let rogueCount = 0

    if (kind === "github") {
      const { data: repo, error } = await supabase
        .from("tracked_repos").select("*").eq("id", target_id).single()
      if (error || !repo) throw new Error("repo not found")

      const known: Set<string> | undefined = Array.isArray(body.known_components)
        ? new Set(body.known_components) : undefined

      const result = await scanGithubRepo({
        owner: repo.owner, repo: repo.repo, branch: repo.default_branch,
        token: body.github_pat, knownComponents: known,
      })
      filesScanned = result.filesScanned

      // collapse usage by (file, component)
      const usageAgg = new Map<string, { component: string; file: string; n: number }>()
      for (const u of result.usage) {
        const k = `${u.file}::${u.component}`
        const prev = usageAgg.get(k)
        if (prev) prev.n++
        else usageAgg.set(k, { component: u.component, file: u.file, n: 1 })
      }
      componentsSeen = new Set([...usageAgg.values()].map(v => v.component)).size
      rogueCount = result.rogue.length

      if (usageAgg.size) {
        await supabase.from("component_usage").insert(
          [...usageAgg.values()].map(v => ({
            user_id: user.id, scan_id: scan.id, source_kind: "github" as const,
            source_id: target_id, team: repo.team, component_name: v.component,
            file_path: v.file, occurrences: v.n,
          }))
        )
      }
      if (result.rogue.length) {
        await supabase.from("rogue_usage").insert(
          result.rogue.slice(0, 2000).map(r => ({
            user_id: user.id, scan_id: scan.id, source_kind: "github" as const,
            source_id: target_id, team: repo.team, file_path: r.file, line: r.line,
            snippet: r.snippet, kind: r.kind, raw_value: r.raw,
            suggested_token: null,
          }))
        )
      }

      await supabase.from("tracked_repos")
        .update({ last_scanned_at: new Date().toISOString(), status: "idle" })
        .eq("id", target_id)
    }

    else if (kind === "figma") {
      const { data: file, error } = await supabase
        .from("tracked_figma_files").select("*").eq("id", target_id).single()
      if (error || !file) throw new Error("figma file not found")
      if (!body.figma_token) throw new Error("figma_token required")

      const result = await scanFigmaFile(file.file_key, body.figma_token)
      filesScanned = 1
      componentsSeen = result.usage.length

      if (result.usage.length) {
        await supabase.from("component_usage").insert(
          result.usage.map(u => ({
            user_id: user.id, scan_id: scan.id, source_kind: "figma" as const,
            source_id: target_id, team: file.team, component_name: u.component,
            file_path: u.file, occurrences: u.occurrences,
          }))
        )
      }
      await supabase.from("tracked_figma_files")
        .update({ last_scanned_at: new Date().toISOString(), status: "idle" })
        .eq("id", target_id)
    }

    await supabase.from("scan_runs").update({
      status: "success", finished_at: new Date().toISOString(),
      files_scanned: filesScanned, components_seen: componentsSeen, rogue_count: rogueCount,
    }).eq("id", scan.id)

    await writeDailySnapshot(supabase, user.id)

    return NextResponse.json({ ok: true, scan_id: scan.id, filesScanned, componentsSeen, rogueCount })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "scan failed"
    await supabase.from("scan_runs").update({
      status: "error", finished_at: new Date().toISOString(), error: msg,
    }).eq("id", scan.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
