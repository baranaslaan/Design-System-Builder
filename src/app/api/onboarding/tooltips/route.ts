// Marks a tooltip as seen for the current user. Idempotent.
import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { tooltip_id } = await req.json()
  if (!tooltip_id) return NextResponse.json({ error: "tooltip_id required" }, { status: 400 })
  const { error } = await auth.supabase.from("tooltips_seen")
    .upsert({ user_id: auth.user.id, tooltip_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
