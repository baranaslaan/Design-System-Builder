"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import * as Dialog from "@radix-ui/react-dialog"
import { X, GitMerge, ArrowLeft, ArrowRight, MinusCircle } from "lucide-react"
import type { TokenConflict } from "@/lib/figma/types"
import { useT } from "@/lib/i18n"

interface Props {
  open: boolean
  conflicts: TokenConflict[]
  onResolve: (resolved: TokenConflict[]) => void
  onCancel: () => void
}

function valuePreview(type: string, value: unknown) {
  if (type === "color" && typeof value === "string") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="w-3.5 h-3.5 rounded border border-[var(--border)]" style={{ background: value }} />
        <code className="font-mono text-[10px]">{value}</code>
      </span>
    )
  }
  return <code className="font-mono text-[10px] text-[var(--foreground)]">{String(value ?? "—")}</code>
}

export function ConflictDiffModal({ open, conflicts, onResolve, onCancel }: Props) {
  const t = useT()
  // Conflicts are passed in once per modal open — the parent rerenders us with
  // a fresh prop each time, so it's safe to initialize once from the prop.
  const [draft, setDraft] = useState<TokenConflict[]>(() =>
    conflicts.map((c) => ({ ...c, resolution: c.resolution ?? "local" })),
  )

  const setAll = (r: "local" | "remote" | "skip") => setDraft((d) => d.map((c) => ({ ...c, resolution: r })))
  const setOne = (i: number, r: "local" | "remote" | "skip") =>
    setDraft((d) => d.map((c, idx) => (idx === i ? { ...c, resolution: r } : c)))

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl focus:outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <GitMerge size={16} className="text-[var(--accent)]" />
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-sm font-semibold">{t("sync_conflict_title")}</Dialog.Title>
                <Dialog.Description className="text-xs text-[var(--muted)] mt-0.5">
                  {t("sync_conflict_subtitle", { n: draft.length })}
                </Dialog.Description>
              </div>
              <Dialog.Close className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]">
                <X size={14} />
              </Dialog.Close>
            </div>

            {/* Bulk actions */}
            <div className="px-5 py-2.5 border-b border-[var(--border)] flex items-center gap-2 text-xs">
              <span className="text-[var(--muted)]">{t("sync_bulk_label")}</span>
              <button onClick={() => setAll("local")}  className="px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)]">{t("sync_all_local")}</button>
              <button onClick={() => setAll("remote")} className="px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)]">{t("sync_all_remote")}</button>
              <button onClick={() => setAll("skip")}   className="px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)]">{t("sync_all_skip")}</button>
            </div>

            {/* Conflicts list */}
            <div className="max-h-[55vh] overflow-y-auto divide-y divide-[var(--border)]">
              {draft.map((c, i) => (
                <div key={c.path} className="px-5 py-3 grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-[var(--muted)] truncate">{c.path}</p>
                    <div className="mt-1">{valuePreview(c.type, c.localValue)}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-[var(--muted)]">
                    <span className="text-[9px] uppercase tracking-wider">{t("sync_local")}</span>
                    <span className="text-[9px] uppercase tracking-wider">{t("sync_remote")}</span>
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="mt-4">{valuePreview(c.type, c.remoteValue)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button title={t("sync_keep_local")}  onClick={() => setOne(i, "local")}  className={`w-7 h-7 flex items-center justify-center rounded border ${c.resolution === "local" ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}><ArrowLeft size={12} /></button>
                    <button title={t("sync_take_remote")} onClick={() => setOne(i, "remote")} className={`w-7 h-7 flex items-center justify-center rounded border ${c.resolution === "remote" ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}><ArrowRight size={12} /></button>
                    <button title={t("sync_skip")}        onClick={() => setOne(i, "skip")}   className={`w-7 h-7 flex items-center justify-center rounded border ${c.resolution === "skip" ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}><MinusCircle size={12} /></button>
                  </div>
                </div>
              ))}
              {draft.length === 0 && (
                <div className="py-10 text-center text-xs text-[var(--muted)]">{t("sync_no_conflicts")}</div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
              <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] hover:border-[var(--accent)]">{t("sync_cancel")}</button>
              <button
                onClick={() => onResolve(draft)}
                className="px-3 py-1.5 text-xs font-medium text-white rounded-md"
                style={{ background: "var(--accent)" }}
              >
                {t("sync_resolve_and_sync")}
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
