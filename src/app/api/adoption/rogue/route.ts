import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const sp = new URL(req.url).searchParams
  const teams = sp.get("teams")?.split(",").filter(Boolean) ?? []
  const kind = sp.get("kind")

  let q = auth.supabase
    .from("rogue_usage")
    .select("id, file_path, line, snippet, kind, raw_value, suggested_token, team, scanned_at")
    .eq("user_id", auth.user.id)
    .order("scanned_at", { ascending: false })
    .limit(500)
  if (teams.length) q = q.in("team", teams)
  if (kind) q = q.eq("kind", kind)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // group by kind
  const groups: Record<string, typeof data> = {}
  for (const r of data ?? []) (groups[r.kind] ??= [] as typeof data).push(r)
  return NextResponse.json({ groups, total: data?.length ?? 0 })
}
