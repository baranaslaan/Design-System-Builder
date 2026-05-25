import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps"
import type { Role } from "@/types/onboarding"

export const dynamic = "force-dynamic"

const VALID_ROLES: Role[] = ["designer", "developer", "manager"]

// Server-derive badges from completed steps so users can't self-grant.
function deriveBadges(role: Role, completed: string[]): string[] {
  const steps = ONBOARDING_STEPS[role] ?? []
  return steps.filter(s => s.badge && completed.includes(s.id)).map(s => s.badge as string)
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const [{ data: progress }, { data: seen }] = await Promise.all([
    auth.supabase.from("onboarding_progress").select("*").eq("user_id", auth.user.id).maybeSingle(),
    auth.supabase.from("tooltips_seen").select("tooltip_id").eq("user_id", auth.user.id),
  ])
  return NextResponse.json({
    progress: progress ?? null,
    seen: (seen ?? []).map((s) => s.tooltip_id),
  })
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await req.json()
  const roleRaw = body?.role
  const role: Role | null = VALID_ROLES.includes(roleRaw) ? roleRaw : null

  // Trust only role + completed_steps from the client. Badges and certificate
  // are derived server-side so a user can't self-award arbitrary badges or
  // backdate their certificate.
  const completedRaw: unknown = body?.completed_steps
  const validIds = new Set((role ? ONBOARDING_STEPS[role] : []).map(s => s.id))
  const completed: string[] = Array.isArray(completedRaw)
    ? [...new Set(completedRaw.filter((s): s is string => typeof s === "string" && validIds.has(s)))]
    : []
  const badges = role ? deriveBadges(role, completed) : []
  const allDone = role ? completed.length === ONBOARDING_STEPS[role].length : false

  // Preserve the first issuance date; never let the client change it.
  const { data: existing } = await auth.supabase.from("onboarding_progress")
    .select("certificate_issued_at").eq("user_id", auth.user.id).maybeSingle()
  const certificate_issued_at = allDone
    ? (existing?.certificate_issued_at ?? new Date().toISOString())
    : null

  const { error } = await auth.supabase.from("onboarding_progress").upsert({
    user_id: auth.user.id,
    role,
    completed_steps: completed,
    badges,
    certificate_issued_at,
    updated_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 400 })
  return NextResponse.json({ ok: true, badges, certificate_issued_at })
}
