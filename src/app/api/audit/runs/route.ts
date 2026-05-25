import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { data, error } = await auth.supabase
    .from("audit_runs").select("*")
    .order("started_at", { ascending: false }).limit(30)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ runs: data ?? [] })
}
