"use client"
// Authed health UI — calls /api/health with the session bearer.
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { apiGet } from "@/lib/adoption/api"

interface Probe { table: string; ok: boolean; error?: string }
interface HealthResp {
  authed: boolean
  env: Record<string, boolean>
  allMigrationsApplied?: boolean
  missing?: Array<{ phase: string; table: string; error?: string }>
  phases?: Record<string, Probe[]>
  componentRegistry?: { seeded: boolean; count: number; hint: string | null }
  user?: { id: string; email: string | null }
  hint?: string
}

export default function HealthPage() {
  const [data, setData] = useState<HealthResp | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    apiGet<HealthResp>("/api/health").then(setData).catch(e => setErr(String(e)))
  }, [])

  if (err) return <div className="p-10 text-sm text-[var(--danger)]">{err}</div>
  if (!data) return <div className="p-10 text-sm text-[var(--muted-foreground)]">Probing…</div>

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="h-5 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold">System Health</h1>
        {data.authed
          ? <span className="ml-2 text-[10px] text-[var(--muted-foreground)]">{data.user?.email}</span>
          : <span className="ml-2 text-[10px] text-[var(--danger)]">not authed</span>}
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-4">
        {!data.authed && (
          <div className="p-3 rounded bg-[var(--surface)] border border-[var(--danger)] text-xs">
            Not authenticated. Sign in from the home page, then come back.
          </div>
        )}

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <h2 className="text-xs uppercase text-[var(--muted-foreground)] mb-3">Environment</h2>
          <ul className="space-y-1 text-xs font-mono">
            {Object.entries(data.env).map(([k, v]) => (
              <li key={k} className="flex items-center gap-2">
                {v ? <CheckCircle2 size={12} className="text-[#10b981]" /> : <XCircle size={12} className="text-[var(--muted-foreground)]" />}
                <span className={v ? "" : "text-[var(--muted-foreground)]"}>{k}</span>
              </li>
            ))}
          </ul>
        </section>

        {data.authed && data.phases && (
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs uppercase text-[var(--muted-foreground)]">Migrations</h2>
              {data.allMigrationsApplied
                ? <span className="text-[11px] text-[#10b981] flex items-center gap-1"><CheckCircle2 size={12} /> All applied</span>
                : <span className="text-[11px] text-[var(--danger)] flex items-center gap-1"><AlertCircle size={12} /> {data.missing?.length} missing</span>}
            </div>
            <div className="space-y-2">
              {Object.entries(data.phases).map(([phase, probes]) => {
                const allOk = probes.every(p => p.ok)
                return (
                  <details key={phase} open={!allOk} className="text-xs">
                    <summary className="cursor-pointer flex items-center gap-2 py-1">
                      {allOk ? <CheckCircle2 size={12} className="text-[#10b981]" /> : <XCircle size={12} className="text-[var(--danger)]" />}
                      <span className="font-mono">{phase}</span>
                      <span className="text-[var(--muted-foreground)]">{probes.filter(p => p.ok).length}/{probes.length}</span>
                    </summary>
                    <ul className="pl-5 mt-1 space-y-0.5">
                      {probes.map(p => (
                        <li key={p.table} className="flex items-center gap-2">
                          {p.ok ? <CheckCircle2 size={10} className="text-[#10b981]" /> : <XCircle size={10} className="text-[var(--danger)]" />}
                          <span className="font-mono text-[11px]">{p.table}</span>
                          {p.error && <span className="text-[10px] text-[var(--danger)] truncate">{p.error}</span>}
                        </li>
                      ))}
                    </ul>
                  </details>
                )
              })}
            </div>
          </section>
        )}

        {data.authed && data.componentRegistry && (
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
            <h2 className="text-xs uppercase text-[var(--muted-foreground)] mb-3">Seed data</h2>
            <div className="flex items-center gap-2 text-xs">
              {data.componentRegistry.seeded
                ? <CheckCircle2 size={12} className="text-[#10b981]" />
                : <AlertCircle size={12} className="text-[#f59e0b]" />}
              <span>component_registry: <span className="font-mono">{data.componentRegistry.count}</span> rows</span>
            </div>
            {data.componentRegistry.hint && (
              <p className="mt-2 text-[11px] text-[var(--muted-foreground)] italic">{data.componentRegistry.hint}</p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
