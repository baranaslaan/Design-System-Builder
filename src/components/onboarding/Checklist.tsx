"use client"
import Link from "next/link"
import { Check, Circle, Trophy } from "lucide-react"
import type { OnboardingStep } from "@/types/onboarding"

export function Checklist({ steps, completed, onMark }: {
  steps: OnboardingStep[]; completed: Set<string>; onMark: (id: string, badge?: string) => void
}) {
  const done = steps.filter(s => completed.has(s.id)).length
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <Trophy size={13} className="text-[var(--accent)]" />
        <h2 className="text-sm font-semibold">Onboarding</h2>
        <span className="ml-auto text-[10px] tabular-nums text-[var(--muted-foreground)]">{done}/{steps.length}</span>
      </div>
      <div className="h-1 bg-[var(--surface-2)]">
        <div className="h-full bg-[var(--accent)] transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {steps.map(s => {
          const isDone = completed.has(s.id)
          return (
            <li key={s.id} className="px-4 py-3 flex items-start gap-3">
              <button onClick={() => onMark(s.id, s.badge)} aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  isDone ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "border-[var(--border)] hover:border-[var(--accent)]"
                }`}>
                {isDone ? <Check size={10} /> : <Circle size={8} className="opacity-0" />}
              </button>
              <div className="flex-1 min-w-0">
                <Link href={s.route} className={`text-xs font-medium ${isDone ? "line-through text-[var(--muted-foreground)]" : "text-[var(--foreground)] hover:text-[var(--accent)]"}`}>
                  {s.title}
                </Link>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{s.description}</p>
              </div>
              {s.badge && isDone && (
                <span className="text-[9px] uppercase font-mono text-[var(--accent)] flex-shrink-0">+{s.badge}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
