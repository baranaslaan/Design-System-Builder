"use client"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, GraduationCap, Palette, Code2, BarChart3, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checklist } from "@/components/onboarding/Checklist"
import { Certificate } from "@/components/onboarding/Certificate"
import { TourOverlay } from "@/components/onboarding/TourOverlay"
import { apiGet, apiSend } from "@/lib/adoption/api"
import { useOnboardingStore } from "@/store/onboarding"
import { stepsFor } from "@/lib/onboarding/steps"
import type { OnboardingProgress, Role } from "@/types/onboarding"

const ROLE_META: Record<Role, { label: string; icon: React.ReactNode; blurb: string }> = {
  designer:  { label: "Designer",  icon: <Palette size={18} />,    blurb: "Component library, tokens, usage guidelines, brand previews." },
  developer: { label: "Developer", icon: <Code2 size={18} />,      blurb: "Code snippets, API docs, audit CI hook, copy-to-clipboard." },
  manager:   { label: "Manager",   icon: <BarChart3 size={18} />,  blurb: "Adoption metrics, quality scoring, brand orchestration." },
}

export default function OnboardingPage() {
  const {
    role, completed, badges, certificateIssuedAt, hydrated,
    setRole, markCompleted, markCertificate, hydrate,
  } = useOnboardingStore()
  const [tourOpen, setTourOpen] = useState(false)
  const [tourIdx, setTourIdx] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const [name, setName] = useState("Team member")

  const persist = useCallback(async () => {
    try {
      await apiSend("/api/onboarding/progress", "PUT", {
        role, completed_steps: [...completed], badges: [...badges],
        certificate_issued_at: certificateIssuedAt,
      })
    } catch (e) { setErr(String(e)) }
  }, [role, completed, badges, certificateIssuedAt])

  useEffect(() => {
    apiGet<{ progress: OnboardingProgress | null; seen: string[] }>("/api/onboarding/progress")
      .then(({ progress, seen }) => hydrate(progress, seen))
      .catch(() => hydrate(null, []))
  }, [hydrate])

  // Auto-persist when completion changes (after hydration)
  useEffect(() => { if (hydrated) persist() }, [completed, badges, role, certificateIssuedAt, hydrated, persist])

  const steps = stepsFor(role)
  const allDone = steps.length > 0 && steps.every(s => completed.has(s.id))
  const pct = steps.length ? Math.round((steps.filter(s => completed.has(s.id)).length / steps.length) * 100) : 0

  useEffect(() => {
    if (allDone && !certificateIssuedAt) markCertificate()
  }, [allDone, certificateIssuedAt, markCertificate])

  const startTour = () => { setTourIdx(0); setTourOpen(true) }
  const onTourNext = () => {
    const cur = steps[tourIdx]
    if (cur) markCompleted(cur.id, cur.badge)
    if (tourIdx + 1 >= steps.length) setTourOpen(false)
    else setTourIdx(i => i + 1)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)] sticky top-0 z-20 bg-[var(--background)]">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={14} /> Back to editor
        </Link>
        <div className="h-5 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold flex items-center gap-1.5"><GraduationCap size={14} /> Onboarding</h1>
        {role && (
          <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{role}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/playground">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Play size={12} /> Playground
            </Button>
          </Link>
          {role && (
            <Button variant="accent" size="sm" onClick={startTour} className="gap-1.5">
              <Play size={12} /> Start tour
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {err && <p className="text-xs text-[var(--danger)]">{err}</p>}

        {!role ? (
          <section>
            <h2 className="text-xs uppercase text-[var(--muted-foreground)] mb-3">Pick your role</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["designer","developer","manager"] as Role[]).map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className="p-5 text-left bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors">
                  <div className="flex items-center gap-2 text-[var(--accent)]">{ROLE_META[r].icon}<span className="text-sm font-semibold">{ROLE_META[r].label}</span></div>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">{ROLE_META[r].blurb}</p>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-7 space-y-4">
              <Checklist steps={steps} completed={completed}
                onMark={(id, badge) => completed.has(id) ? null : markCompleted(id, badge)} />

              {allDone && certificateIssuedAt && (
                <section>
                  <h2 className="text-xs uppercase text-[var(--muted-foreground)] mb-3">Certificate</h2>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                    className="mb-3 w-full max-w-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
                  <Certificate name={name} role={role} badges={[...badges]} issuedAt={certificateIssuedAt} />
                </section>
              )}
            </div>

            <aside className="col-span-12 md:col-span-5 space-y-3">
              <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                <h3 className="text-xs uppercase text-[var(--muted-foreground)] mb-2">Progress</h3>
                <div className="text-3xl font-semibold tabular-nums">{pct}%</div>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                  {completed.size} of {steps.length} steps · {badges.size} badges
                </p>
              </div>
              <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                <h3 className="text-xs uppercase text-[var(--muted-foreground)] mb-2">Badges earned</h3>
                {badges.size === 0 ? (
                  <p className="text-[11px] text-[var(--muted-foreground)] italic">Complete steps to earn badges.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {[...badges].map(b => (
                      <span key={b} className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[var(--accent)] text-white">{b}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { setRole("designer"); /* re-pick */ }} className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                Change role
              </button>
            </aside>
          </div>
        )}
      </main>

      <TourOverlay open={tourOpen} step={steps[tourIdx] ?? null} index={tourIdx} total={steps.length}
        onNext={onTourNext} onClose={() => setTourOpen(false)} />
    </div>
  )
}
