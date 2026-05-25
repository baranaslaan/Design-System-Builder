import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params

  const [{ data: run }, { data: scores, error }] = await Promise.all([
    auth.supabase.from("scoring_runs").select("*").eq("id", id).single(),
    auth.supabase.from("component_scores").select("*").eq("run_id", id)
      .order("component_id"),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ run, scores: scores ?? [] })
}
