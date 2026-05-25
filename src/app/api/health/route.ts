// GET /api/health
// Login sonrası: 16 yeni tabloyu sırayla probe eder, eksik / RLS sorunu olanları rapor eder.
// Anon: sadece env + Supabase URL reachability bildirir.
import { NextResponse, type NextRequest } from "next/server"
import { requireUser, supabaseFromRequest } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const TABLES_BY_PHASE: Record<string, string[]> = {
  "0001 baseline":   ["profiles", "token_sets"],
  "0002 figma":      ["figma_links", "sync_logs"],
  "0003 adoption":   ["tracked_repos", "tracked_figma_files", "component_registry", "scan_runs", "component_usage", "rogue_usage", "adoption_snapshots"],
  "0004 audit":      ["audit_runs", "audit_findings"],
  "0005 scoring":    ["scoring_runs", "component_scores"],
  "0006 brands":     ["brands", "brand_members", "token_layers", "merge_conflicts"],
  "0007 onboarding": ["onboarding_progress", "tooltips_seen"],
  "0010 security":   ["figma_user_tokens", "ci_tokens"],
}

export async function GET(req: NextRequest) {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SESSION_ENC_KEY: !!process.env.SESSION_ENC_KEY,
    FIGMA_CLIENT_ID: !!process.env.FIGMA_CLIENT_ID,
    FIGMA_CLIENT_SECRET: !!process.env.FIGMA_CLIENT_SECRET,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  }

  const auth = await requireUser(req)
  if ("error" in auth) {
    // Anonymous probe — at least try Supabase URL reachability.
    const { supabase } = supabaseFromRequest(req)
    let supabaseReachable = false
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1)
      supabaseReachable = !error || error.code === "42501" // RLS denial = reachable
    } catch { /* network */ }
    return NextResponse.json({
      authed: false, env, supabaseReachable,
      hint: "Sign in to run the full migration check.",
    })
  }

  // Authed: probe every table. Use a real select (not head) to surface the
  // actual postgrest error shape (code/details/hint, not just message).
  const phases: Record<string, Array<{ table: string; ok: boolean; error?: string; code?: string; details?: string; hint?: string }>> = {}
  for (const [phase, tables] of Object.entries(TABLES_BY_PHASE)) {
    phases[phase] = []
    for (const t of tables) {
      const res = await auth.supabase.from(t).select("*").limit(1)
      const err = res.error
      phases[phase].push({
        table: t,
        ok: !err,
        error: err?.message || (err ? JSON.stringify(err) : undefined),
        code: err?.code,
        details: err?.details ?? undefined,
        hint: err?.hint ?? undefined,
      })
    }
  }

  // Component registry seeded check
  const { count: registryCount } = await auth.supabase
    .from("component_registry").select("*", { count: "exact", head: true })

  const allOk = Object.values(phases).every(arr => arr.every(r => r.ok))
  const missing = Object.entries(phases).flatMap(([phase, arr]) =>
    arr.filter(r => !r.ok).map(r => ({ phase, ...r }))
  )

  return NextResponse.json({
    authed: true,
    env,
    allMigrationsApplied: allOk,
    missing,
    phases,
    componentRegistry: {
      seeded: (registryCount ?? 0) > 0,
      count: registryCount ?? 0,
      hint: (registryCount ?? 0) === 0
        ? "Run supabase/seeds/component_registry.sql in Studio (while logged in as this user)."
        : null,
    },
    user: { id: auth.user.id, email: auth.user.email },
  })
}
