"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw, Trash2, Clock, Camera, X, GitCompare, ChevronDown } from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { Button } from "@/components/ui/button"
import { TokenDiffModal } from "./TokenDiffModal"
import { PRESETS } from "@/data/presets"
import { useT } from "@/lib/i18n"
import type { DesignTokens } from "@/types/tokens"

interface HistoryPanelProps {
  open: boolean
  onClose: () => void
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

export function HistoryPanel({ open, onClose }: HistoryPanelProps) {
  const { history, restoreHistory, clearHistory, pushHistory, tokens, customPresets } = useTokensStore()
  const t = useT()

  const [diff, setDiff] = useState<{
    before: DesignTokens
    after: DesignTokens
    beforeLabel: string
    afterLabel: string
  } | null>(null)

  const [compareTarget, setCompareTarget] = useState<string>("current")

  const compareOptions = [
    { value: "current", label: t("history_current") },
    ...Object.entries(PRESETS).map(([k, v]) => ({ value: `preset:${k}`, label: `Preset: ${v.name}` })),
    ...customPresets.map((p) => ({ value: `custom:${p.id}`, label: `Saved: ${p.name}` })),
  ]

  function resolveTarget(target: string): { tokens: DesignTokens; label: string } | null {
    if (target === "current") return { tokens, label: tokens.name || "Current" }
    if (target.startsWith("preset:")) {
      const key = target.slice(7)
      const p = PRESETS[key]
      return p ? { tokens: p, label: `Preset: ${p.name}` } : null
    }
    if (target.startsWith("custom:")) {
      const id = target.slice(7)
      const p = customPresets.find((c) => c.id === id)
      return p ? { tokens: p.tokens, label: `Saved: ${p.name}` } : null
    }
    return null
  }

  function openDiff(historyTokens: DesignTokens, historyLabel: string) {
    const target = resolveTarget(compareTarget)
    if (!target) return
    setDiff({
      before: historyTokens,
      after: target.tokens,
      beforeLabel: historyLabel,
      afterLabel: target.label,
    })
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={onClose}
            />

            {/* Panel — slides in from right */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 right-0 h-full w-80 z-40 flex flex-col border-l border-[var(--border)] bg-[var(--surface)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[var(--accent)]" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">{t("history_title")}</span>
                  {history.length > 0 && (
                    <span className="text-[10px] font-mono bg-[var(--surface-3)] text-[var(--muted)] px-1.5 py-0.5 rounded-full">
                      {history.length}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X size={14} />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 px-4 py-3 border-b border-[var(--border)]">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => pushHistory("Manual snapshot")}
                >
                  <Camera size={12} /> {t("history_save")}
                </Button>
                {history.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs text-[var(--muted)] hover:text-red-400"
                    onClick={clearHistory}
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>

              {/* Compare target selector */}
              {history.length > 0 && (
                <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <GitCompare size={11} className="text-[var(--accent)]" />
                    <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                      {t("history_compare_against")}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={compareTarget}
                      onChange={(e) => setCompareTarget(e.target.value)}
                      className="w-full appearance-none bg-[var(--surface-3)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] pr-7 transition-colors"
                    >
                      {compareOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                  </div>
                </div>
              )}

              {/* History list */}
              <div className="flex-1 overflow-y-auto py-2">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] flex items-center justify-center">
                      <Clock size={18} className="text-[var(--muted)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{t("history_empty")}</div>
                      <div className="text-xs text-[var(--muted)] mt-1">{t("history_empty_desc")}</div>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {history.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.02 }}
                        className="group flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
                      >
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center mt-1 flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--accent-muted)]" />
                          {i < history.length - 1 && <div className="w-px flex-1 bg-[var(--border)] mt-1 min-h-[16px]" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[var(--foreground)] truncate">{entry.label}</div>
                          <div className="text-[10px] text-[var(--muted)] mt-0.5">{formatRelative(entry.timestamp)}</div>
                          <div className="text-[10px] text-[var(--muted)] font-mono truncate">{entry.tokens.name}</div>
                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                              onClick={() => openDiff(entry.tokens, entry.label)}
                              title="Compare this snapshot"
                            >
                              <GitCompare size={10} /> {t("history_diff")}
                            </button>
                            <span className="text-[var(--border)]">·</span>
                            <button
                              className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                              onClick={() => { restoreHistory(entry.id); onClose() }}
                              title="Restore this version"
                            >
                              <RotateCcw size={10} /> {t("history_restore")}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {diff && (
        <TokenDiffModal
          open={!!diff}
          onClose={() => setDiff(null)}
          before={diff.before}
          after={diff.after}
          beforeLabel={diff.beforeLabel}
          afterLabel={diff.afterLabel}
        />
      )}
    </>
  )
}
