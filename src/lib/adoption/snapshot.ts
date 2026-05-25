// Aggregate the latest scans into per-component daily snapshots.
import type { SupabaseClient } from "@supabase/supabase-js"

export async function writeDailySnapshot(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10)

  const { data: registry } = await supabase
    .from("component_registry").select("component_name").eq("user_id", userId)
  const total = registry?.length ?? 0

  // distinct components seen in latest usage rows (last 30 days)
  const since = new Date(Date.now() - 30 * 864e5).toISOString()
  const { data: usage } = await supabase
    .from("component_usage")
    .select("component_name, team, occurrences")
    .eq("user_id", userId)
    .gte("scanned_at", since)

  const perComponent = new Map<string, number>()
  for (const u of usage ?? []) {
    perComponent.set(u.component_name, (perComponent.get(u.component_name) ?? 0) + (u.occurrences ?? 0))
  }
  const usedCount = perComponent.size

  const { count: rogueCount } = await supabase
    .from("rogue_usage").select("*", { count: "exact", head: true })
    .eq("user_id", userId).gte("scanned_at", since)

  const rate = total > 0 ? usedCount / total : 0

  await supabase.from("adoption_snapshots").upsert({
    user_id: userId,
    taken_at: today,
    component_name: null,
    team: null,
    used_count: usedCount,
    available_count: total,
    rate,
    rogue_count: rogueCount ?? 0,
  }, { onConflict: "user_id,taken_at,component_name,team" })

  // Per-component snapshots
  for (const [name, occ] of perComponent) {
    await supabase.from("adoption_snapshots").upsert({
      user_id: userId,
      taken_at: today,
      component_name: name,
      team: null,
      used_count: occ > 0 ? 1 : 0,
      available_count: 1,
      rate: occ > 0 ? 1 : 0,
      rogue_count: 0,
    }, { onConflict: "user_id,taken_at,component_name,team" })
  }
}
