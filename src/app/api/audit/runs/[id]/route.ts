import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params

  const [{ data: run }, { data: findings, error }] = await Promise.all([
    auth.supabase.from("audit_runs").select("*").eq("id", id).single(),
    auth.supabase.from("audit_findings").select("*").eq("run_id", id)
      .order("severity", { ascending: true }).order("created_at", { ascending: true }),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ run, findings: findings ?? [] })
}
