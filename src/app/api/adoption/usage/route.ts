// GET /api/adoption/usage?teams=a,b&components=Button,Card&from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns per-component rollup + KPI summary.
import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"
import type { ComponentAdoptionRow } from "@/types/adoption"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth

  const sp = new URL(req.url).searchParams
  const teams = sp.get("teams")?.split(",").filter(Boolean) ?? []
  const components = sp.get("components")?.split(",").filter(Boolean) ?? []
  const from = sp.get("from")
  const to = sp.get("to")

  let q = supabase
    .from("component_usage")
    .select("component_name, team, source_kind, source_id, file_path, occurrences, scanned_at")
    .eq("user_id", user.id)
  if (teams.length) q = q.in("team", teams)
  if (components.length) q = q.in("component_name", components)
  if (from) q = q.gte("scanned_at", from)
  if (to)   q = q.lte("scanned_at", to)
  const { data: usage, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: registry } = await supabase
    .from("component_registry").select("component_name").eq("user_id", user.id)
  const totalAvailable = registry?.length ?? 0

  // per-component rollup
  const byComp = new Map<string, ComponentAdoptionRow>()
  for (const u of usage ?? []) {
    const row = byComp.get(u.component_name) ?? {
      component_name: u.component_name,
      repos_count: 0, files_count: 0, occurrences: 0,
      available: totalAvailable, rate: 0, trend: [],
    }
    row.occurrences += u.occurrences ?? 0
    byComp.set(u.component_name, row)
  }
  // compute repos/files
  for (const [name] of byComp) {
    const rows = (usage ?? []).filter(u => u.component_name === name)
    byComp.get(name)!.repos_count = new Set(rows.map(r => r.source_id)).size
    byComp.get(name)!.files_count = new Set(rows.map(r => r.file_path)).size
  }
  // adoption rate = used components / available
  const used = byComp.size
  const overallRate = totalAvailable > 0 ? used / totalAvailable : 0
  for (const row of byComp.values()) {
    row.rate = row.occurrences > 0 ? 1 : 0
  }

  // trend sparkline: last 14 days of overall snapshots
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10)
  const { data: snaps } = await supabase
    .from("adoption_snapshots")
    .select("taken_at, rate, component_name")
    .eq("user_id", user.id)
    .is("team", null)
    .gte("taken_at", since)
    .order("taken_at", { ascending: true })

  const overallTrend = (snaps ?? []).filter(s => s.component_name === null).map(s => Number(s.rate))
  for (const row of byComp.values()) {
    row.trend = (snaps ?? [])
      .filter(s => s.component_name === row.component_name).map(s => Number(s.rate))
  }

  const { count: rogueCount } = await supabase
    .from("rogue_usage").select("*", { count: "exact", head: true }).eq("user_id", user.id)

  return NextResponse.json({
    summary: {
      overallRate,
      usedComponents: used,
      totalAvailable,
      rogueCount: rogueCount ?? 0,
      overallTrend,
    },
    components: [...byComp.values()].sort((a, b) => b.occurrences - a.occurrences),
  })
}
