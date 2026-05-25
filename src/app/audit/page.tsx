"use client"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Play, AlertOctagon, AlertTriangle, Info, Sparkles, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FindingCard } from "@/components/audit/FindingCard"
import { CiSetupPanel } from "@/components/audit/CiSetupPanel"
import { apiGet, apiSend } from "@/lib/adoption/api"
import { useAdoptionStore } from "@/store/adoption"
import { useAuditStore } from "@/store/audit"
import { useTokensStore } from "@/store/tokens"
import type { AuditFinding, AuditRun, Severity } from "@/types/audit"

interface RunsResp { runs: AuditRun[] }
interface RunResp { run: AuditRun; findings: AuditFinding[] }
interface SourcesResp { repos: { id: string }[]; figmaFiles: { id: string }[] }

export default function AuditPage() {
  const tokens = useTokensStore(s => s.tokens)
  const { repos, figmaFiles, setRepos, setFigmaFiles } = useAdoptionStore()
  const {
    currentRun, findings, runs, activeSeverity, running,
    setCurrentRun, setFindings, setRuns, setActiveSeverity, setRunning,
  } = useAuditStore()

  const [useAi, setUseAi] = useState(true)
  const [pat, setPat] = useState("")
  const [figmaToken, setFigmaToken] = useState("")
  const [err, setErr] = useState<string | null>(null)

  // bootstrap sources + runs
  const bootstrap = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        apiGet<SourcesResp>("/api/adoption/sources"),
        apiGet<RunsResp>("/api/audit/runs"),
      ])
      setRepos(s.repos as never); setFigmaFiles(s.figmaFiles as never)
      setRuns(r.runs)
      if (r.runs[0] && !currentRun) await loadRun(r.runs[0].id)
    } catch (e) { setErr(String(e)) }
  }, [])
  useEffect(() => { bootstrap() }, [bootstrap])

  const loadRun = async (id: string) => {
    try {
      const r = await apiGet<RunResp>(`/api/audit/runs/${id}`)
      setCurrentRun(r.run); setFindings(r.findings)
    } catch (e) { setErr(String(e)) }
  }

  const runAudit = async () => {
    setErr(null); setRunning(true)
    try {
      const body = {
        tokens, use_ai: useAi, trigger: "manual",
        repos:      repos.map(r => ({ id: r.id, github_pat: pat || undefined })),
        figmaFiles: figmaFiles.map(f => ({ id: f.id, figma_token: figmaToken || undefined })),
      }
      const res = await apiSend<{ run_id: string }>("/api/audit/run", "POST", body)
      await loadRun(res.run_id)
      const r = await apiGet<RunsResp>("/api/audit/runs")
      setRuns(r.runs)
    } catch (e) { setErr(String(e)) } finally { setRunning(false) }
  }

  const filtered = activeSeverity === "all"
    ? findings
    : findings.filter(f => f.severity === activeSeverity)

  const sum = currentRun?.summary ?? { critical: 0, warning: 0, info: 0, total: 0, by_kind: {} }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)] sticky top-0 z-20 bg-[var(--background)]">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={14} /> Back to editor
        </Link>
        <div className="h-5 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold">Consistency Audit</h1>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] cursor-pointer">
            <input type="checkbox" checked={useAi} onChange={e => setUseAi(e.target.checked)} className="accent-[var(--accent)]" />
            <Sparkles size={11} /> Use AI
          </label>
          <Button variant="accent" size="sm" onClick={runAudit} disabled={running || (!repos.length && !figmaFiles.length)} className="gap-1.5">
            <Play size={12} /> {running ? "Auditing…" : "Run audit"}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Token / PAT inputs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <label className="text-[10px] uppercase text-[var(--muted-foreground)]">GitHub PAT (private repos)</label>
            <input type="password" value={pat} onChange={e => setPat(e.target.value)}
              placeholder={`Scanning ${repos.length} repo(s)`}
              className="mt-1 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
          </div>
          <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <label className="text-[10px] uppercase text-[var(--muted-foreground)]">Figma PAT</label>
            <input type="password" value={figmaToken} onChange={e => setFigmaToken(e.target.value)}
              placeholder={`Scanning ${figmaFiles.length} file(s)`}
              className="mt-1 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
          </div>
        </section>

        {err && <p className="text-xs text-[var(--danger)]">{err}</p>}

        {/* Severity tabs / KPIs */}
        <section className="grid grid-cols-4 gap-3">
          {([
            { key: "all",      label: "Total",    n: sum.total,    icon: null,                                tone: "var(--foreground)" },
            { key: "critical", label: "Critical", n: sum.critical, icon: <AlertOctagon size={12} />,           tone: "var(--danger)" },
            { key: "warning",  label: "Warning",  n: sum.warning,  icon: <AlertTriangle size={12} />,          tone: "#f59e0b" },
            { key: "info",     label: "Info",     n: sum.info,     icon: <Info size={12} />,                   tone: "#3b82f6" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setActiveSeverity(t.key as Severity | "all")}
              className={`p-4 bg-[var(--surface)] border rounded-lg text-left transition-colors ${
                activeSeverity === t.key ? "border-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
              }`}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide" style={{ color: t.tone }}>
                {t.icon}{t.label}
              </div>
              <div className="text-2xl font-semibold tabular-nums mt-2" style={{ color: t.tone }}>{t.n}</div>
            </button>
          ))}
        </section>

        {/* Current run + history */}
        {currentRun && (
          <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
            <span>Run {currentRun.id.slice(0, 8)} · {new Date(currentRun.started_at).toLocaleString()}</span>
            {currentRun.use_ai && <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] flex items-center gap-1"><Sparkles size={9} /> AI · {currentRun.ai_model}</span>}
            <span className="ml-auto flex items-center gap-1"><History size={11} /> {runs.length} runs</span>
            {runs.length > 1 && (
              <select value={currentRun.id} onChange={e => loadRun(e.target.value)}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[10px]">
                {runs.map(r => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.started_at).toLocaleString()} — {r.summary?.total ?? 0} findings
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Findings list */}
        <section>
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--muted-foreground)] bg-[var(--surface)] border border-[var(--border)] rounded-lg">
              {currentRun ? "No findings at this severity — clean!" : "Run your first audit to see findings."}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 200).map(f => <FindingCard key={f.id} f={f} />)}
              {filtered.length > 200 && (
                <p className="text-[11px] text-[var(--muted-foreground)] text-center">
                  Showing first 200 of {filtered.length}.
                </p>
              )}
            </div>
          )}
        </section>

        <CiSetupPanel />
      </main>
    </div>
  )
}
