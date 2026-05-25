"use client"
import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Database, AlertTriangle, TrendingUp, Package, Settings2, Filter, X } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Sparkline } from "@/components/adoption/Sparkline"
import { TrendChart } from "@/components/adoption/TrendChart"
import { SourceManager } from "@/components/adoption/SourceManager"
import { apiGet } from "@/lib/adoption/api"
import { useAdoptionStore } from "@/store/adoption"
import type { ComponentAdoptionRow } from "@/types/adoption"

interface UsageResp {
  summary: { overallRate: number; usedComponents: number; totalAvailable: number; rogueCount: number; overallTrend: number[] }
  components: ComponentAdoptionRow[]
}
interface RogueResp { groups: Record<string, Array<{ id: string; file_path: string; line: number | null; kind: string; raw_value: string; suggested_token: string | null; team: string | null }>>; total: number }
interface TrendResp { points: Array<{ taken_at: string; rate: number }> }

export default function AdoptionPage() {
  const { filters, setFilters, resetFilters, repos, figmaFiles } = useAdoptionStore()
  const [usage, setUsage] = useState<UsageResp | null>(null)
  const [rogue, setRogue] = useState<RogueResp | null>(null)
  const [trend, setTrend] = useState<TrendResp | null>(null)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [rogueKind, setRogueKind] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.teams.length) params.set("teams", filters.teams.join(","))
    if (filters.components.length) params.set("components", filters.components.join(","))
    if (filters.from) params.set("from", filters.from)
    if (filters.to) params.set("to", filters.to)
    try {
      const [u, r, t] = await Promise.all([
        apiGet<UsageResp>(`/api/adoption/usage?${params}`),
        apiGet<RogueResp>(`/api/adoption/rogue${rogueKind ? `?kind=${rogueKind}` : ""}`),
        apiGet<TrendResp>(`/api/adoption/trend${filters.from ? `?from=${filters.from}` : ""}${filters.to ? `&to=${filters.to}` : ""}`),
      ])
      setUsage(u); setRogue(r); setTrend(t)
    } catch { /* surfaced elsewhere */ } finally { setLoading(false) }
  }, [filters, rogueKind])

  useEffect(() => { fetchAll() }, [fetchAll])

  const allTeams = useMemo(() => {
    const s = new Set<string>()
    repos.forEach(r => r.team && s.add(r.team))
    figmaFiles.forEach(f => f.team && s.add(f.team))
    return [...s]
  }, [repos, figmaFiles])

  const toggleTeam = (t: string) => {
    const set = new Set(filters.teams)
    set.has(t) ? set.delete(t) : set.add(t)
    setFilters({ teams: [...set] })
  }

  const fmtPct = (v: number) => `${Math.round(v * 100)}%`

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)] sticky top-0 z-20 bg-[var(--background)]">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={14} /> Back to editor
        </Link>
        <div className="h-5 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold">Adoption Analytics</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchAll} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
          <Button variant="accent" size="sm" onClick={() => setSourcesOpen(true)} className="gap-1.5">
            <Settings2 size={12} /> Sources
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={<TrendingUp size={14} />} label="Overall adoption" value={fmtPct(usage?.summary.overallRate ?? 0)}
            sub={`${usage?.summary.usedComponents ?? 0} / ${usage?.summary.totalAvailable ?? 0} components`}
            spark={usage?.summary.overallTrend} />
          <Kpi icon={<Package size={14} />} label="Components used" value={String(usage?.summary.usedComponents ?? 0)}
            sub={`of ${usage?.summary.totalAvailable ?? 0} available`} />
          <Kpi icon={<AlertTriangle size={14} />} label="Rogue values" value={String(usage?.summary.rogueCount ?? 0)}
            sub="hardcoded — should use tokens" tone="danger" />
          <Kpi icon={<Database size={14} />} label="Sources" value={String(repos.length + figmaFiles.length)}
            sub={`${repos.length} repos · ${figmaFiles.length} Figma`} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <Filter size={12} className="text-[var(--muted-foreground)]" />
          <span className="text-xs text-[var(--muted-foreground)] mr-1">Filters</span>
          {allTeams.length === 0 && <span className="text-xs text-[var(--muted-foreground)] italic">No teams yet — add team labels when registering sources.</span>}
          {allTeams.map(t => (
            <button key={t} onClick={() => toggleTeam(t)}
              className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                filters.teams.includes(t)
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]"
              }`}>{t}</button>
          ))}
          <div className="h-4 w-px bg-[var(--border)] mx-1" />
          <input type="date" value={filters.from ?? ""} onChange={e => setFilters({ from: e.target.value || null })}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2 py-0.5 text-[10px] focus:border-[var(--accent)] focus:outline-none" />
          <span className="text-[10px] text-[var(--muted-foreground)]">→</span>
          <input type="date" value={filters.to ?? ""} onChange={e => setFilters({ to: e.target.value || null })}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2 py-0.5 text-[10px] focus:border-[var(--accent)] focus:outline-none" />
          {(filters.teams.length || filters.from || filters.to || filters.components.length) && (
            <button onClick={resetFilters} className="ml-auto text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1">
              <X size={10} /> Reset
            </button>
          )}
        </div>

        {/* Trend chart */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Adoption trend</h2>
            <span className="text-[10px] text-[var(--muted-foreground)]">{trend?.points.length ?? 0} snapshots</span>
          </div>
          <TrendChart points={trend?.points ?? []} />
        </section>

        {/* Components table */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Components</h2>
            <span className="text-[10px] text-[var(--muted-foreground)]">{usage?.components.length ?? 0} tracked</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase text-[var(--muted-foreground)] bg-[var(--surface-2)]">
                <tr>
                  <th className="text-left px-4 py-2">Component</th>
                  <th className="text-right px-4 py-2">Repos / Files</th>
                  <th className="text-right px-4 py-2">Occurrences</th>
                  <th className="text-right px-4 py-2">Adoption</th>
                  <th className="text-right px-4 py-2 pr-6">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {(usage?.components ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                    No usage data yet — add a source and run a scan.
                  </td></tr>
                )}
                {usage?.components.map(c => (
                  <motion.tr key={c.component_name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-2.5 font-medium">{c.component_name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[var(--muted-foreground)]">
                      {c.repos_count} · {c.files_count}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{c.occurrences}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.round(c.rate * 100)}%` }} />
                        </div>
                        <span className="tabular-nums text-[10px] text-[var(--muted-foreground)]">{fmtPct(c.rate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 pr-6 text-right">
                      <div className="inline-block"><Sparkline values={c.trend} /></div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rogue panel */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Rogue values</h2>
            <span className="text-[10px] text-[var(--muted-foreground)]">{rogue?.total ?? 0} found</span>
            <div className="ml-auto flex items-center gap-1">
              {["color", "spacing", "radius", "shadow", "font-size"].map(k => (
                <button key={k} onClick={() => setRogueKind(rogueKind === k ? null : k)}
                  className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                    rogueKind === k
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]"
                  }`}>{k}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-[var(--border)] max-h-[400px] overflow-y-auto">
            {!rogue?.total && <p className="px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">No rogue values — nice!</p>}
            {rogue && Object.entries(rogue.groups).map(([kind, items]) => (
              <div key={kind} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{kind}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">({items.length})</span>
                </div>
                <div className="space-y-1.5">
                  {items.slice(0, 20).map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-[11px]">
                      {r.kind === "color" && r.raw_value.startsWith("#") && (
                        <span className="w-3 h-3 rounded border border-[var(--border)]" style={{ background: r.raw_value }} />
                      )}
                      <code className="font-mono bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{r.raw_value}</code>
                      <span className="text-[var(--muted-foreground)] truncate flex-1">
                        {r.file_path}{r.line ? `:${r.line}` : ""}
                      </span>
                      {r.suggested_token && (
                        <span className="text-[10px] text-[var(--accent)] font-mono">→ {r.suggested_token}</span>
                      )}
                    </div>
                  ))}
                  {items.length > 20 && <p className="text-[10px] text-[var(--muted-foreground)]">+ {items.length - 20} more…</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SourceManager open={sourcesOpen} onClose={() => setSourcesOpen(false)} onScanned={fetchAll} />
    </div>
  )
}

function Kpi({
  icon, label, value, sub, spark, tone = "default",
}: { icon: React.ReactNode; label: string; value: string; sub?: string; spark?: number[]; tone?: "default" | "danger" }) {
  return (
    <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
        {icon}{label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${tone === "danger" ? "text-[var(--danger)]" : ""}`}>{value}</div>
      <div className="flex items-center justify-between mt-1">
        {sub && <p className="text-[10px] text-[var(--muted-foreground)]">{sub}</p>}
        {spark && spark.length > 0 && <Sparkline values={spark} width={60} height={18} />}
      </div>
    </div>
  )
}
