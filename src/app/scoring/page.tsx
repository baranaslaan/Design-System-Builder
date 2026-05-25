"use client"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Play, FileDown, History, GitCompareArrows } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScoreBadge } from "@/components/scoring/ScoreBadge"
import { ScorePanel } from "@/components/scoring/ScorePanel"
import { ScoreDiffModal } from "@/components/scoring/ScoreDiffModal"
import { SCORED_VARIANTS } from "@/components/scoring/scoredVariants"
import { scoreComponents, aggregateByComponent, hashTokens } from "@/lib/scoring/engine"
import { diffRuns } from "@/lib/scoring/diff"
import { apiGet, apiSend } from "@/lib/adoption/api"
import { useTokensStore } from "@/store/tokens"
import { useScoringStore } from "@/store/scoring"
import type { ComponentScore, ScoringRun } from "@/types/scoring"

interface RunsResp { runs: ScoringRun[] }
interface RunResp  { run: ScoringRun; scores: ComponentScore[] }

export default function ScoringPage() {
  const tokens = useTokensStore(s => s.tokens)
  const {
    currentRun, scores, previousScores, diff, runs, running,
    setRunning, setCurrent, setPrevious, setDiff, setRuns,
  } = useScoringStore()
  const [selected, setSelected] = useState<ComponentScore | null>(null)
  const [diffOpen, setDiffOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const bootstrap = useCallback(async () => {
    try {
      const r = await apiGet<RunsResp>("/api/scoring/history")
      setRuns(r.runs)
      if (r.runs[0]) {
        const cur = await apiGet<RunResp>(`/api/scoring/runs/${r.runs[0].id}`)
        setCurrent(cur.run, cur.scores)
        if (r.runs[1]) {
          const prev = await apiGet<RunResp>(`/api/scoring/runs/${r.runs[1].id}`)
          setPrevious(prev.run, prev.scores)
          setDiff(diffRuns(prev.scores.filter(s => s.variant === null), cur.scores.filter(s => s.variant === null)))
        }
      }
    } catch (e) { setErr(String(e)) }
  }, [])
  useEffect(() => { bootstrap() }, [bootstrap])

  const runScoring = async () => {
    setErr(null); setRunning(true)
    try {
      const variantScores = await scoreComponents(SCORED_VARIANTS, tokens)
      const aggregate     = aggregateByComponent(variantScores)
      const all           = [...aggregate, ...variantScores] // store both aggregate (variant=null) and variant rows
      const avg = (k: "a11y_score" | "brand_score") =>
        aggregate.length ? aggregate.reduce((s, c) => s + c[k], 0) / aggregate.length : 0

      const res = await apiSend<{ run_id: string }>("/api/scoring/run", "POST", {
        trigger: "manual",
        tokens_hash: hashTokens(tokens),
        avg_a11y: avg("a11y_score"),
        avg_brand: avg("brand_score"),
        components: all,
      })
      const cur = await apiGet<RunResp>(`/api/scoring/runs/${res.run_id}`)
      // shift current → previous
      if (currentRun) {
        setPrevious(currentRun, scores)
        setDiff(diffRuns(scores.filter(s => s.variant === null), cur.scores.filter(s => s.variant === null)))
      }
      setCurrent(cur.run, cur.scores)
      const list = await apiGet<RunsResp>("/api/scoring/history")
      setRuns(list.runs)
    } catch (e) { setErr(String(e)) } finally { setRunning(false) }
  }

  const aggregate = scores.filter(s => s.variant === null)
  const regressions = diff.filter(d => d.a11y_delta < 0 || d.brand_delta < 0).length

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)] sticky top-0 z-20 bg-[var(--background)]">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={14} /> Back to editor
        </Link>
        <div className="h-5 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold">Quality Scoring</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDiffOpen(true)} disabled={diff.length === 0} className="gap-1.5">
            <GitCompareArrows size={12} /> Diff
            {regressions > 0 && <span className="ml-1 px-1 rounded bg-[var(--danger)] text-white text-[9px] font-semibold">{regressions}</span>}
          </Button>
          {currentRun && (
            <Link href={`/scoring/report/${currentRun.id}/print`} target="_blank">
              <Button variant="ghost" size="sm" className="gap-1.5"><FileDown size={12} /> Export PDF</Button>
            </Link>
          )}
          <Button variant="accent" size="sm" onClick={runScoring} disabled={running} className="gap-1.5">
            <Play size={12} /> {running ? "Scoring…" : "Run scoring"}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {err && <p className="text-xs text-[var(--danger)]">{err}</p>}

        {/* Averages */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <div className="text-[10px] uppercase text-[var(--muted-foreground)] mb-1">Avg accessibility</div>
            <div className="text-3xl font-semibold tabular-nums">{currentRun?.avg_a11y ?? "—"}</div>
          </div>
          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <div className="text-[10px] uppercase text-[var(--muted-foreground)] mb-1">Avg brand</div>
            <div className="text-3xl font-semibold tabular-nums">{currentRun?.avg_brand ?? "—"}</div>
          </div>
          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <div className="text-[10px] uppercase text-[var(--muted-foreground)] mb-1 flex items-center gap-1.5"><History size={11} /> History</div>
            <div className="text-3xl font-semibold tabular-nums">{runs.length}</div>
            <div className="text-[10px] text-[var(--muted-foreground)]">snapshots</div>
          </div>
        </section>

        {/* Component grid */}
        <section>
          <h2 className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-3">Components</h2>
          {aggregate.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--muted-foreground)] bg-[var(--surface)] border border-[var(--border)] rounded-lg">
              No scores yet — click <strong>Run scoring</strong> to evaluate all components.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {aggregate.map(c => {
                const prev = previousScores.find(p => p.variant === null && p.component_id === c.component_id)
                const a11yDelta = prev ? c.a11y_score - prev.a11y_score : 0
                const brandDelta = prev ? c.brand_score - prev.brand_score : 0
                return (
                  <button key={c.component_id} onClick={() => setSelected(c)}
                    className="text-left p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">{c.component_id}</h3>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {scores.filter(s => s.component_id === c.component_id && s.variant !== null).length} variants
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ScoreBadge label="A11y" value={c.a11y_score} />
                      {a11yDelta !== 0 && <span className="text-[9px] tabular-nums" style={{ color: a11yDelta > 0 ? "#10b981" : "var(--danger)" }}>
                        {a11yDelta > 0 ? "+" : ""}{a11yDelta}
                      </span>}
                      <ScoreBadge label="Brand" value={c.brand_score} />
                      {brandDelta !== 0 && <span className="text-[9px] tabular-nums" style={{ color: brandDelta > 0 ? "#10b981" : "var(--danger)" }}>
                        {brandDelta > 0 ? "+" : ""}{brandDelta}
                      </span>}
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-3">
                      {c.breakdown.a11y.issues.length} a11y issue{c.breakdown.a11y.issues.length === 1 ? "" : "s"} ·{" "}
                      {c.breakdown.brand.offTokens.length} off-token value{c.breakdown.brand.offTokens.length === 1 ? "" : "s"}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <ScorePanel open={!!selected} onClose={() => setSelected(null)} score={selected} />
      <ScoreDiffModal open={diffOpen} onClose={() => setDiffOpen(false)} diff={diff} />
    </div>
  )
}
