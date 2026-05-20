"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Minus, ArrowRight, GitCompare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { diffTokens, diffSummary, type DiffGroup } from "@/lib/diff"
import { useT } from "@/lib/i18n"
import type { DesignTokens } from "@/types/tokens"

function shortKey(key: string) {
  return key.split(".").slice(1).join(".")
}

function ValueChip({ value, type }: { value: string; type: "before" | "after" }) {
  const isColor = /^#[0-9a-f]{3,8}$/i.test(value.trim())
  return (
    <span className="flex items-center gap-1 font-mono text-[10px] max-w-[140px] truncate">
      {isColor && (
        <span
          className="w-3 h-3 rounded-sm flex-shrink-0 border border-white/10 inline-block"
          style={{ background: value }}
        />
      )}
      <span
        className={
          type === "before"
            ? "text-[var(--danger)] line-through opacity-70"
            : "text-emerald-400"
        }
      >
        {value}
      </span>
    </span>
  )
}

function DiffBadge({ type }: { type: "added" | "removed" | "changed" }) {
  if (type === "added")
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase tracking-wide">+new</span>
  if (type === "removed")
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-[var(--danger)] uppercase tracking-wide">del</span>
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 uppercase tracking-wide">mod</span>
}

function GroupSection({ group }: { group: DiffGroup }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2 sticky top-0 bg-[var(--surface)] z-10 border-b border-[var(--border)]">
        <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">{group.label}</span>
        <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded-full">
          {group.entries.length}
        </span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {group.entries.map((entry) => (
          <motion.div
            key={entry.key}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors group"
          >
            <DiffBadge type={entry.type} />
            <span className="text-xs font-mono text-[var(--foreground)] flex-1 truncate min-w-0">
              {shortKey(entry.key)}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {entry.before && <ValueChip value={entry.before} type="before" />}
              {entry.before && entry.after && (
                <ArrowRight size={10} className="text-[var(--muted)] flex-shrink-0" />
              )}
              {entry.after && <ValueChip value={entry.after} type="after" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

interface TokenDiffModalProps {
  open: boolean
  onClose: () => void
  before: DesignTokens
  after: DesignTokens
  beforeLabel: string
  afterLabel: string
}

export function TokenDiffModal({
  open,
  onClose,
  before,
  after,
  beforeLabel,
  afterLabel,
}: TokenDiffModalProps) {
  const t = useT()
  const groups = useMemo(() => diffTokens(before, after), [before, after])
  const summary = useMemo(() => diffSummary(groups), [groups])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed inset-x-4 top-8 bottom-8 z-50 max-w-2xl mx-auto flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <GitCompare size={16} className="text-[var(--accent)]" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--foreground)]">{t("diff_title")}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-[var(--danger)] truncate max-w-[140px]">{beforeLabel}</span>
                  <ArrowRight size={9} className="text-[var(--muted)] flex-shrink-0" />
                  <span className="text-[10px] font-mono text-emerald-400 truncate max-w-[140px]">{afterLabel}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onClose} aria-label="Close">
                <X size={14} />
              </Button>
            </div>

            {/* Summary bar */}
            {summary.total > 0 && (
              <div className="flex items-center gap-4 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)] flex-shrink-0">
                <span className="text-xs text-[var(--muted)]">{t("diff_changes", { n: summary.total })}</span>
                <div className="flex items-center gap-3 ml-auto">
                  {summary.added > 0 && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <Plus size={11} /> {t("diff_added", { n: summary.added })}
                    </span>
                  )}
                  {summary.removed > 0 && (
                    <span className="flex items-center gap-1 text-xs text-[var(--danger)]">
                      <Minus size={11} /> {t("diff_removed", { n: summary.removed })}
                    </span>
                  )}
                  {summary.changed > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <ArrowRight size={11} /> {t("diff_changed", { n: summary.changed })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Diff content */}
            <div className="flex-1 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                    <GitCompare size={20} className="text-[var(--muted)]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--foreground)]">{t("diff_no_differences")}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">{t("diff_identical")}</div>
                  </div>
                </div>
              ) : (
                <div>
                  {groups.map((group) => (
                    <GroupSection key={group.category} group={group} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
