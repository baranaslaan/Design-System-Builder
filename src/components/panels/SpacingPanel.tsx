"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { CopyBadge } from "@/components/ui/CopyBadge"
import { EditableKey } from "@/components/ui/EditableKey"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

export function SpacingPanel({ filter = "" }: { filter?: string }) {
  const { tokens, updateSpacing, renameSpacing, addSpacing, removeSpacing } = useTokensStore()
  const t = useT()
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("16px")
  const q = filter.toLowerCase()

  const sortedKeys = Object.keys(tokens.spacing).sort((a, b) => {
    const pa = parseFloat(tokens.spacing[a]) || 0
    const pb = parseFloat(tokens.spacing[b]) || 0
    return pa - pb
  })

  const visibleKeys = sortedKeys.filter(
    (key) => !q || key.includes(q) || (tokens.spacing[key] ?? "").includes(q)
  )

  const handleAdd = () => {
    const k = newKey.trim()
    if (!k) return
    addSpacing(k, newValue)
    setNewKey("")
    setNewValue("16px")
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center px-3 mb-1">
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider w-28">{t("col_key")}</span>
        <span className="flex-1 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t("col_visual")}</span>
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t("col_value")}</span>
      </div>

      <AnimatePresence initial={false}>
        {visibleKeys.map((key) => {
          const value = tokens.spacing[key] ?? "0px"
          const px = parseInt(value)
          const barWidth = Math.min((px / 96) * 100, 100)
          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            >
              <div className="w-28 flex items-center gap-1.5 shrink-0">
                <EditableKey value={key} onRename={(newK) => renameSpacing(key, newK)} />
                <CopyBadge cssVar={`--spacing-${key}`} value={value} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    animate={{ width: `${barWidth}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                  />
                </div>
                <span className="text-xs font-mono text-[var(--muted)] w-10 text-right">{px}px</span>
              </div>
              <input
                className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md px-2 py-1 text-xs font-mono text-[var(--foreground)] w-20 text-right focus:outline-none focus:border-[var(--accent)] transition-colors"
                value={value}
                onChange={(e) => updateSpacing(key, e.target.value)}
              />
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-400 shrink-0"
                onClick={() => removeSpacing(key)}
                title={t("btn_remove")}
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--accent)] overflow-hidden"
          >
            <input
              autoFocus
              className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md px-2 py-1 text-xs font-mono text-[var(--foreground)] w-20 focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false) }}
            />
            <input
              className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md px-2 py-1 text-xs font-mono text-[var(--foreground)] w-20 text-right focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false) }}
            />
            <Button size="sm" className="h-7 px-3 text-xs" onClick={handleAdd}>{t("btn_add")}</Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAdding(false)}>{t("btn_cancel")}</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setAdding(true)}
        className="mt-1 w-full justify-start gap-2 text-[var(--muted)]"
      >
        <Plus size={13} /> {t("btn_add_spacing")}
      </Button>
    </div>
  )
}
