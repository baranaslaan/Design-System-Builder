"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { CopyBadge } from "@/components/ui/CopyBadge"
import { EditableKey } from "@/components/ui/EditableKey"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

export function StrokePanel({ filter = "" }: { filter?: string }) {
  const { tokens, updateStroke, renameStroke, addStroke, removeStroke } = useTokensStore()
  const t = useT()
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("1px")
  const q = filter.toLowerCase()

  const allKeys = Object.keys(tokens.stroke).sort((a, b) => {
    return (parseFloat(tokens.stroke[a]) || 0) - (parseFloat(tokens.stroke[b]) || 0)
  })
  const visible = allKeys.filter((key) => !q || key.includes(q) || tokens.stroke[key].includes(q))

  const handleAdd = () => {
    const k = newKey.trim()
    if (!k) return
    addStroke(k, newValue)
    setNewKey("")
    setNewValue("1px")
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {visible.map((key) => {
          const value = tokens.stroke[key]
          const px = parseInt(value)
          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              whileHover={{ x: 2 }}
              className="group flex items-center gap-4 px-4 py-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]"
            >
              <div className="flex items-center justify-center w-16 h-12 flex-shrink-0">
                <div
                  className="w-12 h-8 rounded-lg border-[var(--accent)] bg-[var(--accent-muted)]"
                  style={{ borderWidth: value, borderStyle: "solid" }}
                />
              </div>

              <div className="flex-1">
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {px === 0 ? "none" : `${px}px`}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[var(--muted)]">stroke-</span>
                  <EditableKey value={key} onRename={(newK) => renameStroke(key, newK)} />
                  <CopyBadge cssVar={`--stroke-${key}`} value={value} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <input
                className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md px-2 py-1 text-xs font-mono text-[var(--foreground)] w-20 text-right focus:outline-none focus:border-[var(--accent)] transition-colors"
                value={value}
                onChange={(e) => updateStroke(key, e.target.value)}
              />

              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-400 shrink-0"
                onClick={() => removeStroke(key)}
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
        className="w-full justify-start gap-2 text-[var(--muted)]"
      >
        <Plus size={13} /> {t("btn_add_stroke")}
      </Button>
    </div>
  )
}
