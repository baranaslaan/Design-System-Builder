"use client"
import { useEffect, useState, use as usePromise } from "react"
import { apiGet } from "@/lib/adoption/api"
import type { ComponentScore, ScoringRun } from "@/types/scoring"

interface RunResp { run: ScoringRun; scores: ComponentScore[] }

export default function PrintReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params)
  const [data, setData] = useState<RunResp | null>(null)

  useEffect(() => {
    apiGet<RunResp>(`/api/scoring/runs/${id}`).then(setData)
  }, [id])

  // Auto-open print dialog once data renders.
  useEffect(() => {
    if (data) setTimeout(() => window.print(), 400)
  }, [data])

  if (!data) return <div className="p-10 text-sm text-neutral-500">Loading report…</div>
  const { run, scores } = data
  const aggregate = scores.filter(s => s.variant === null)

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .page-break { break-after: page; }
        }
        body { font-family: ui-sans-serif, system-ui, sans-serif; color: #111; background: #fafafa; }
        .doc { max-width: 800px; margin: 0 auto; padding: 32px; background: white; }
        h1 { font-size: 22px; margin: 0 0 6px; }
        h2 { font-size: 14px; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
        .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
        .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .kpi { padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px; }
        .kpi .label { font-size: 10px; text-transform: uppercase; color: #666; }
        .kpi .value { font-size: 28px; font-weight: 600; margin-top: 4px; font-variant-numeric: tabular-nums; }
        .row { padding: 10px 0; border-top: 1px solid #eee; }
        .row .head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
        .chip { display: inline-flex; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-family: ui-monospace, monospace; font-weight: 600; }
        .ok { background: #ecfdf5; color: #047857; }
        .warn { background: #fffbeb; color: #b45309; }
        .bad { background: #fef2f2; color: #b91c1c; }
        .issue { font-size: 11px; color: #555; margin: 2px 0 0 20px; }
        .print-btn { position: fixed; top: 12px; right: 12px; padding: 6px 12px; font-size: 12px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; }
      `}</style>
      <button className="print-btn no-print" onClick={() => window.print()}>Print / Save PDF</button>
      <div className="doc">
        <h1>Design System Quality Report</h1>
        <div className="meta">
          Run {run.id.slice(0, 8)} · {new Date(run.taken_at).toLocaleString()} · {run.component_n} components
        </div>

        <div className="kpi-row">
          <div className="kpi"><div className="label">Avg accessibility</div><div className="value">{Math.round(Number(run.avg_a11y))}</div></div>
          <div className="kpi"><div className="label">Avg brand</div><div className="value">{Math.round(Number(run.avg_brand))}</div></div>
          <div className="kpi"><div className="label">Components</div><div className="value">{aggregate.length}</div></div>
        </div>

        <h2>Components</h2>
        {aggregate.map(c => {
          const chip = (v: number) => v >= 90 ? "ok" : v >= 75 ? "warn" : "bad"
          return (
            <div className="row" key={c.component_id}>
              <div className="head">
                <span>{c.component_id}</span>
                <span className={`chip ${chip(c.a11y_score)}`}>A11y {Math.round(c.a11y_score)}</span>
                <span className={`chip ${chip(c.brand_score)}`}>Brand {Math.round(c.brand_score)}</span>
              </div>
              {c.breakdown.a11y.issues.slice(0, 8).map(i => (
                <div key={i.id} className="issue">• [{i.severity}] {i.msg}{i.wcag ? ` (WCAG ${i.wcag})` : ""}</div>
              ))}
              {c.breakdown.brand.offTokens.slice(0, 6).map((t, i) => (
                <div key={`b${i}`} className="issue">• off-{t.kind}: {t.raw}</div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
