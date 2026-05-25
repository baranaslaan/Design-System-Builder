"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertOctagon, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScoreBadge } from "./ScoreBadge"
import type { ComponentScore } from "@/types/scoring"

const SEV_ICON = { critical: <AlertOctagon size={11} />, warning: <AlertTriangle size={11} />, info: <Info size={11} /> } as const
const SEV_COLOR = { critical: "var(--danger)", warning: "#f59e0b", info: "#3b82f6" } as const

export function ScorePanel({ open, onClose, score }: { open: boolean; onClose: () => void; score: ComponentScore | null }) {
  const [tab, setTab] = useState<"a11y" | "brand">("a11y")
  if (!score) return null
  const a = score.breakdown.a11y, b = score.breakdown.brand

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[80vh] bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold">{score.component_id}</h2>
                {score.variant && <span className="text-[10px] text-[var(--muted-foreground)] uppercase">{score.variant}</span>}
                <ScoreBadge label="A11y"  value={score.a11y_score} />
                <ScoreBadge label="Brand" value={score.brand_score} />
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X size={14} /></Button>
            </div>

            <div className="flex border-b border-[var(--border)]">
              {(["a11y", "brand"] as const).map(k => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex-1 px-4 py-2 text-xs font-medium uppercase tracking-wide ${
                    tab === k ? "text-[var(--foreground)] border-b-2 border-[var(--accent)]" : "text-[var(--muted-foreground)]"
                  }`}>{k === "a11y" ? "Accessibility" : "Brand"}</button>
              ))}
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              {tab === "a11y" ? (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      ["Contrast", a.contrast, "1.4.3"],
                      ["Touch",    a.touch,    "2.5.8"],
                      ["Focus",    a.focus,    "2.4.7"],
                      ["Scaling",  a.scaling,  "1.4.4"],
                    ].map(([label, v, wcag]) => (
                      <div key={String(label)} className="p-2 bg-[var(--surface-2)] rounded">
                        <div className="text-[9px] uppercase text-[var(--muted-foreground)]">{label}</div>
                        <div className="text-xl font-semibold tabular-nums">{v as number}</div>
                        <div className="text-[9px] text-[var(--muted-foreground)] font-mono">WCAG {wcag}</div>
                      </div>
                    ))}
                  </div>
                  <h3 className="text-[10px] uppercase text-[var(--muted-foreground)] mb-2">{a.issues.length} issues</h3>
                  <div className="space-y-1.5">
                    {a.issues.length === 0 && <p className="text-xs text-[var(--muted-foreground)] italic">No issues — clean!</p>}
                    {a.issues.map(i => (
                      <div key={i.id} className="flex items-start gap-2 p-2 bg-[var(--surface-2)] rounded text-[11px]">
                        <span className="mt-0.5" style={{ color: SEV_COLOR[i.severity] }}>{SEV_ICON[i.severity]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ color: SEV_COLOR[i.severity] }} className="font-semibold uppercase text-[9px]">{i.severity}</span>
                            {i.wcag && <span className="font-mono text-[9px] text-[var(--muted-foreground)]">WCAG {i.wcag}</span>}
                            {i.el && <code className="text-[10px] text-[var(--muted-foreground)] truncate">{i.el}</code>}
                          </div>
                          <p>{i.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      ["Color",   b.colorCoverage],
                      ["Font",    b.fontCoverage],
                      ["Spacing", b.spacingCoverage],
                    ].map(([label, v]) => (
                      <div key={String(label)} className="p-2 bg-[var(--surface-2)] rounded">
                        <div className="text-[9px] uppercase text-[var(--muted-foreground)]">{label}</div>
                        <div className="text-xl font-semibold tabular-nums">{Math.round((v as number) * 100)}%</div>
                      </div>
                    ))}
                  </div>
                  <h3 className="text-[10px] uppercase text-[var(--muted-foreground)] mb-2">{b.offTokens.length} off-token values</h3>
                  <div className="space-y-1.5">
                    {b.offTokens.length === 0 && <p className="text-xs text-[var(--muted-foreground)] italic">All values map to tokens.</p>}
                    {b.offTokens.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-[var(--surface-2)] rounded text-[11px]">
                        {t.kind === "color" && t.raw.startsWith("#") &&
                          <span className="w-3 h-3 rounded border border-[var(--border)]" style={{ background: t.raw }} />}
                        <code className="font-mono">{t.raw}</code>
                        <span className="ml-auto text-[9px] uppercase text-[var(--muted-foreground)]">{t.kind}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
