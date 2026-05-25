// POST /api/scoring/run
// Body: { trigger?, tokens_hash?, avg_a11y, avg_brand, components: ComponentScore[] }
// The scoring computation runs in the BROWSER (needs DOM). This endpoint
// just persists the snapshot.
import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"
import { rateLimitOrDeny, LIMITS } from "@/lib/security/rateLimit"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth

  const denied = rateLimitOrDeny(`scoring:${user.id}`, LIMITS.scoring)
  if (denied) return denied

  const body = await req.json()
  const { trigger = "manual", tokens_hash = null, avg_a11y = 0, avg_brand = 0, components = [] } = body
  if (!Array.isArray(components)) return NextResponse.json({ error: "components must be array" }, { status: 400 })

  const { data: run, error: runErr } = await supabase
    .from("scoring_runs")
    .insert({
      user_id: user.id, trigger, tokens_hash,
      avg_a11y, avg_brand, component_n: components.length,
    })
    .select().single()
  if (runErr || !run) return NextResponse.json({ error: runErr?.message ?? "insert failed" }, { status: 500 })

  if (components.length) {
    const rows = components.map((c: { component_id: string; variant: string | null; a11y_score: number; brand_score: number; breakdown: unknown }) => ({
      user_id: user.id, run_id: run.id,
      component_id: c.component_id, variant: c.variant,
      a11y_score: c.a11y_score, brand_score: c.brand_score,
      breakdown: c.breakdown,
    }))
    const { error } = await supabase.from("component_scores").insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ run_id: run.id })
}
