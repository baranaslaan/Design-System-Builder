"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ScoreDiff } from "@/types/scoring"

function Delta({ d }: { d: number }) {
  if (d === 0) return <span className="inline-flex items-center gap-0.5 text-[var(--muted-foreground)]"><Minus size={10} />0</span>
  const up = d > 0
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums" style={{ color: up ? "#10b981" : "var(--danger)" }}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{up ? "+" : ""}{d}
    </span>
  )
}

export function ScoreDiffModal({ open, onClose, diff }: { open: boolean; onClose: () => void; diff: ScoreDiff[] }) {
  const drops = diff.filter(d => d.a11y_delta < 0 || d.brand_delta < 0)
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[80vh] bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Score diff</h2>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {drops.length} regression{drops.length === 1 ? "" : "s"} · {diff.length - drops.length} stable/improved
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X size={14} /></Button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {diff.length === 0 && <p className="text-xs text-[var(--muted-foreground)] italic text-center py-8">No prior run to compare against.</p>}
              {diff.map(d => (
                <div key={d.component_id} className={`p-3 rounded-lg border ${
                  d.a11y_delta < 0 || d.brand_delta < 0
                    ? "border-[var(--danger)] bg-[rgba(239,68,68,0.04)]"
                    : "border-[var(--border)] bg-[var(--surface-2)]"
                }`}>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold">{d.component_id}</span>
                    <span className="text-[var(--muted-foreground)]">A11y: {d.a11y_before} → {d.a11y_after}</span>
                    <Delta d={d.a11y_delta} />
                    <span className="text-[var(--muted-foreground)]">Brand: {d.brand_before} → {d.brand_after}</span>
                    <Delta d={d.brand_delta} />
                  </div>
                  {d.newIssues.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[9px] uppercase text-[var(--danger)] mb-1">+ {d.newIssues.length} new issue(s)</div>
                      <ul className="text-[11px] space-y-0.5">
                        {d.newIssues.slice(0, 5).map(i => <li key={i.id} className="text-[var(--muted-foreground)]">• {i.msg}</li>)}
                      </ul>
                    </div>
                  )}
                  {d.resolvedIssues.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[9px] uppercase text-[#10b981] mb-1">✓ {d.resolvedIssues.length} resolved</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
