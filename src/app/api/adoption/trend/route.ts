import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const sp = new URL(req.url).searchParams
  const from = sp.get("from") ?? new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10)
  const to = sp.get("to") ?? new Date().toISOString().slice(0, 10)
  const component = sp.get("component")
  const team = sp.get("team")

  let q = auth.supabase
    .from("adoption_snapshots")
    .select("taken_at, rate, used_count, available_count, rogue_count, component_name, team")
    .eq("user_id", auth.user.id)
    .gte("taken_at", from).lte("taken_at", to)
    .order("taken_at", { ascending: true })
  q = component ? q.eq("component_name", component) : q.is("component_name", null)
  q = team ? q.eq("team", team) : q.is("team", null)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ points: data ?? [] })
}
