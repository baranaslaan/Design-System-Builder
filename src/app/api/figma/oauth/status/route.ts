import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const u = await requireUser(req)
  if ("error" in u) return NextResponse.json({ connected: false })
  const { data } = await u.supabase.from("figma_user_tokens")
    .select("user_id").eq("user_id", u.user.id).maybeSingle()
  return NextResponse.json({ connected: !!data })
}

export async function DELETE(req: NextRequest) {
  const u = await requireUser(req)
  if ("error" in u) return NextResponse.json({ error: u.error }, { status: u.status })
  await u.supabase.from("figma_user_tokens").delete().eq("user_id", u.user.id)
  return NextResponse.json({ ok: true })
}
