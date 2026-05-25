import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Strict validators — these values are later interpolated into outbound URLs
// (GitHub / Figma APIs). Loose input → SSRF + header injection.
const SAFE_SEGMENT = /^[A-Za-z0-9._-]{1,100}$/
const SAFE_KEY     = /^[A-Za-z0-9]{6,64}$/
const SAFE_TEAM    = /^[A-Za-z0-9 _-]{1,40}$/
const SAFE_NAME    = /^[\w .'-]{1,120}$/

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const [{ data: repos }, { data: figmaFiles }] = await Promise.all([
    auth.supabase.from("tracked_repos").select("*").order("created_at", { ascending: false }),
    auth.supabase.from("tracked_figma_files").select("*").order("created_at", { ascending: false }),
  ])
  return NextResponse.json({ repos: repos ?? [], figmaFiles: figmaFiles ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  if (body.kind === "github") {
    const { owner, repo, default_branch = "main", team = null } = body
    if (!SAFE_SEGMENT.test(owner ?? "") || !SAFE_SEGMENT.test(repo ?? ""))
      return NextResponse.json({ error: "invalid owner/repo" }, { status: 400 })
    if (!SAFE_SEGMENT.test(default_branch ?? "main"))
      return NextResponse.json({ error: "invalid branch" }, { status: 400 })
    if (team !== null && !SAFE_TEAM.test(team))
      return NextResponse.json({ error: "invalid team" }, { status: 400 })
    const { data, error } = await auth.supabase
      .from("tracked_repos")
      .insert({ user_id: auth.user.id, owner, repo, default_branch, team })
      .select().single()
    if (error) return NextResponse.json({ error: "insert_failed" }, { status: 400 })
    return NextResponse.json({ repo: data })
  }
  if (body.kind === "figma") {
    const { file_key, file_name = null, team = null } = body
    if (!SAFE_KEY.test(file_key ?? ""))
      return NextResponse.json({ error: "invalid file_key" }, { status: 400 })
    if (file_name !== null && !SAFE_NAME.test(file_name))
      return NextResponse.json({ error: "invalid file_name" }, { status: 400 })
    if (team !== null && !SAFE_TEAM.test(team))
      return NextResponse.json({ error: "invalid team" }, { status: 400 })
    const { data, error } = await auth.supabase
      .from("tracked_figma_files")
      .insert({ user_id: auth.user.id, file_key, file_name, team })
      .select().single()
    if (error) return NextResponse.json({ error: "insert_failed" }, { status: 400 })
    return NextResponse.json({ figmaFile: data })
  }
  return NextResponse.json({ error: "unknown kind" }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { searchParams } = new URL(req.url)
  const kind = searchParams.get("kind")
  const id = searchParams.get("id")
  if (!id || (kind !== "github" && kind !== "figma"))
    return NextResponse.json({ error: "bad params" }, { status: 400 })
  const table = kind === "github" ? "tracked_repos" : "tracked_figma_files"
  const { error } = await auth.supabase.from(table).delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
