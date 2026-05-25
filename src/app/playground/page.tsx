"use client"
// Isolated sandbox: clones the live tokens into a separate localStorage key
// so the new-team-member can experiment without touching the real system.
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTokensStore } from "@/store/tokens"
import { SCORED_VARIANTS } from "@/components/scoring/scoredVariants"
import type { DesignTokens } from "@/types/tokens"

const STORAGE_KEY = "dsb-playground-tokens-v1"

function cssVars(t: DesignTokens): React.CSSProperties {
  const v: Record<string, string> = {}
  const sem = (t.colors?.semantic ?? []).find(s => s.name === "primary" || s.name === "accent")
  if (sem) v["--accent"] = sem.lightValue
  for (const [k, val] of Object.entries(t.spacing ?? {})) v[`--spacing-${k}`] = String(val)
  for (const [k, val] of Object.entries(t.radius ?? {}))  v[`--radius-${k}`]  = String(val)
  if (t.typography?.fontFamilies?.sans) v["--font-sans"] = t.typography.fontFamilies.sans
  return v as React.CSSProperties
}

export default function PlaygroundPage() {
  const live = useTokensStore(s => s.tokens)
  const [local, setLocal] = useState<DesignTokens | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      setLocal(raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(live)))
    } catch { setLocal(JSON.parse(JSON.stringify(live))) }
  }, [live])

  const save = (next: DesignTokens) => {
    setLocal(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* noop */ }
  }
  const reset = () => save(JSON.parse(JSON.stringify(live)))

  const updateAccent = (hex: string) => {
    if (!local) return
    const next = JSON.parse(JSON.stringify(local)) as DesignTokens
    const sem = next.colors?.semantic?.find(s => s.name === "primary" || s.name === "accent")
    if (sem) { sem.lightValue = hex; sem.darkValue = hex }
    save(next)
  }
  const updateRadius = (px: string) => {
    if (!local) return
    const next = JSON.parse(JSON.stringify(local)) as DesignTokens
    if (next.radius && "md" in next.radius) (next.radius as Record<string, string>).md = px
    save(next)
  }

  if (!local) return <div className="p-10 text-sm text-[var(--muted-foreground)]">Loading playground…</div>

  const accent = (local.colors?.semantic ?? []).find(s => s.name === "primary" || s.name === "accent")?.lightValue ?? "#7c3aed"
  const radiusMd = ((local.radius ?? {}) as Record<string, string>).md ?? "8px"

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)] sticky top-0 z-20 bg-[var(--background)]">
        <Link href="/onboarding" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={14} /> Onboarding
        </Link>
        <div className="h-5 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold flex items-center gap-1.5"><Play size={14} /> Playground</h1>
        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-[var(--surface-2)] text-[var(--muted-foreground)]">
          isolated · changes don't affect the system
        </span>
        <Button variant="ghost" size="sm" onClick={reset} className="ml-auto gap-1.5">
          <RotateCcw size={12} /> Reset to live
        </Button>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-12 gap-4">
        <aside className="col-span-12 md:col-span-4 space-y-3">
          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <h3 className="text-xs uppercase text-[var(--muted-foreground)] mb-2">Accent color</h3>
            <div className="flex items-center gap-2">
              <input type="color" value={accent} onChange={e => updateAccent(e.target.value)}
                className="w-10 h-10 rounded border border-[var(--border)] bg-transparent" />
              <code className="font-mono text-xs">{accent}</code>
            </div>
          </div>
          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <h3 className="text-xs uppercase text-[var(--muted-foreground)] mb-2">Radius md</h3>
            <input type="range" min={0} max={32} value={parseInt(radiusMd, 10)}
              onChange={e => updateRadius(`${e.target.value}px`)} className="w-full accent-[var(--accent)]" />
            <code className="font-mono text-xs">{radiusMd}</code>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] italic px-1">
            Edits live only in your browser. Production tokens are untouched.
          </p>
        </aside>

        <section className="col-span-12 md:col-span-8 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4"
          style={cssVars(local)}>
          {SCORED_VARIANTS.map(v => (
            <div key={`${v.component_id}-${v.variant}`} className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--muted-foreground)] w-24 truncate">{v.component_id}/{v.variant}</span>
              {v.node}
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
