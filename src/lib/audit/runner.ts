// Orchestrates an audit run: GH scans + Figma deviation scans → token suggestions
// → severity classification (rule-based, optionally refined by Claude) →
// persisted as audit_findings + summary on audit_runs.

import type { SupabaseClient } from "@supabase/supabase-js"
import { scanGithubRepo } from "@/lib/adoption/scanGithub"
import { scanFigmaDeviations } from "./figmaDeviation"
import { suggestToken } from "@/lib/adoption/tokenMatcher"
import { classifySeverity } from "./severity"
import { classifyWithAI, AI_MODEL_ID, type ClassifyInput } from "./aiClassifier"
import type { DesignTokens } from "@/types/tokens"
import type { Severity, FindingKind, AuditSummary } from "@/types/audit"

export interface RunInput {
  userId: string
  tokens: DesignTokens
  use_ai?: boolean
  trigger?: "manual" | "ci" | "scheduled"
  repos: Array<{ id: string; owner: string; repo: string; default_branch: string; team: string | null; pat?: string; label: string }>
  figmaFiles: Array<{ id: string; file_key: string; file_name: string | null; team: string | null; token?: string; label: string }>
  knownComponents?: string[]
}

export interface RunOutput {
  run_id: string
  summary: AuditSummary
  finding_count: number
}

interface StagedFinding {
  source_kind: "github" | "figma"
  source_id: string | null
  source_label: string
  kind: FindingKind
  location: string
  raw_value: string
  suggested_token: string | null
  distance?: number
}

function colorDistance(a: string, b: string): number {
  const p = (s: string) => {
    let x = s.replace("#", "")
    if (x.length === 3) x = x.split("").map(c => c + c).join("")
    const n = parseInt(x.slice(0, 6), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
  }
  if (!a.startsWith("#") || !b.startsWith("#")) return Infinity
  const A = p(a), B = p(b)
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2])
}

export async function runAudit(supabase: SupabaseClient, input: RunInput): Promise<RunOutput> {
  const { userId, tokens, repos, figmaFiles } = input

  const { data: run, error: runErr } = await supabase
    .from("audit_runs")
    .insert({
      user_id: userId,
      trigger: input.trigger ?? "manual",
      status: "running",
      use_ai: !!input.use_ai,
      ai_model: input.use_ai ? AI_MODEL_ID : null,
    })
    .select().single()
  if (runErr || !run) throw new Error("audit_run insert failed")

  try {
    const staged: StagedFinding[] = []
    const known = input.knownComponents ? new Set(input.knownComponents) : undefined

    // 1) GitHub scans
    for (const r of repos) {
      const res = await scanGithubRepo({
        owner: r.owner, repo: r.repo, branch: r.default_branch,
        token: r.pat, knownComponents: known,
      })
      for (const hit of res.rogue) {
        const suggested = suggestToken(hit.kind, hit.raw, tokens)
        staged.push({
          source_kind: "github", source_id: r.id, source_label: r.label,
          kind: hit.kind, location: `${hit.file}:${hit.line}`,
          raw_value: hit.raw, suggested_token: suggested,
        })
      }
    }

    // 2) Figma scans
    for (const f of figmaFiles) {
      if (!f.token) continue
      const devs = await scanFigmaDeviations(f.file_key, f.token)
      for (const d of devs) {
        let suggested: string | null = null
        let distance: number | undefined
        if (d.kind === "figma-fill" || d.kind === "figma-stroke") {
          suggested = suggestToken("color", d.raw_value, tokens)
          if (suggested) {
            // Find original token value for distance calc
            for (const pal of tokens.colors?.palettes ?? []) {
              for (const [, hex] of Object.entries(pal.shades)) {
                if (suggested.endsWith(pal.name + "-" + Object.keys(pal.shades).find(k => pal.shades[k] === hex))) {
                  distance = colorDistance(d.raw_value, hex)
                }
              }
            }
          }
        }
        staged.push({
          source_kind: "figma", source_id: f.id, source_label: f.label,
          kind: d.kind, location: d.location, raw_value: d.raw_value,
          suggested_token: suggested, distance,
        })
      }
    }

    // 3) Rule-based severity
    const baseClassified = staged.map(s => {
      const cls = classifySeverity({ kind: s.kind, raw: s.raw_value, suggested: s.suggested_token, distance: s.distance })
      return { ...s, severity: cls.severity, confidence: cls.confidence, ai_reason: cls.reason }
    })

    // 4) Optional AI refinement (batch of up to 80 to keep prompt small)
    let final = baseClassified
    if (input.use_ai && baseClassified.length) {
      const batch: ClassifyInput[] = baseClassified.slice(0, 80).map(s => ({
        kind: s.kind, raw: s.raw_value, location: s.location,
        suggested: s.suggested_token, base_severity: s.severity,
      }))
      const ai = await classifyWithAI(batch)
      if (ai) {
        final = baseClassified.map((s, i) =>
          i < ai.length
            ? { ...s, severity: ai[i].severity, confidence: ai[i].confidence, ai_reason: ai[i].reason }
            : s
        )
      }
    }

    // 5) Persist findings (cap to 5000 per run for safety)
    const toInsert = final.slice(0, 5000).map(f => ({
      user_id: userId,
      run_id: run.id,
      source_kind: f.source_kind,
      source_id: f.source_id,
      source_label: f.source_label,
      severity: f.severity as Severity,
      kind: f.kind,
      location: f.location,
      raw_value: f.raw_value,
      suggested_token: f.suggested_token,
      confidence: f.confidence,
      ai_reason: f.ai_reason,
    }))
    if (toInsert.length) {
      await supabase.from("audit_findings").insert(toInsert)
    }

    // 6) Summary
    const summary: AuditSummary = { critical: 0, warning: 0, info: 0, total: toInsert.length, by_kind: {} }
    for (const f of toInsert) {
      summary[f.severity]++
      summary.by_kind[f.kind] = (summary.by_kind[f.kind] ?? 0) + 1
    }

    await supabase.from("audit_runs").update({
      status: "success",
      finished_at: new Date().toISOString(),
      summary,
    }).eq("id", run.id)

    return { run_id: run.id, summary, finding_count: toInsert.length }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "audit failed"
    await supabase.from("audit_runs").update({
      status: "error", finished_at: new Date().toISOString(), error: msg,
    }).eq("id", run.id)
    throw e
  }
}
