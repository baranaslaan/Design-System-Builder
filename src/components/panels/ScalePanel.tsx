"use client"

import { useState, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import { CopyBadge } from "@/components/ui/CopyBadge"
import { EditableKey } from "@/components/ui/EditableKey"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

interface ScalePanelProps {
  scale: Record<string, string>
  cssVarPrefix: string                 // e.g. "--opacity-"
  filter?: string
  defaultValue?: string                // value placeholder for "add" form
  addLabel: string
  onUpdate: (key: string, value: string) => void
  onAdd: (key: string, value: string) => void
  onRemove: (key: string) => void
  onRename: (oldKey: string, newKey: string) => void
  sort?: (a: string, b: string, scale: Record<string, string>) => number
  /** Custom visualization rendered between the key and the input */
  renderVisual?: (key: string, value: string) => ReactNode
}

export function ScalePanel({
  scale, cssVarPrefix, filter = "", defaultValue = "",
  addLabel, onUpdate, onAdd, onRemove, onRename,
  sort, renderVisual,
}: ScalePanelProps) {
  const t = useT()
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState(defaultValue)
  const q = filter.toLowerCase()

  const keys = Object.keys(scale)
  const sortedKeys = sort ? [...keys].sort((a, b) => sort(a, b, scale)) : keys
  const visibleKeys = sortedKeys.filter(
    (k) => !q || k.toLowerCase().includes(q) || (scale[k] ?? "").toLowerCase().includes(q)
  )

  const handleAdd = () => {
    const k = newKey.trim()
    if (!k) return
    onAdd(k, newValue.trim() || defaultValue)
    setNewKey("")
    setNewValue(defaultValue)
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center px-3 mb-1">
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider w-32">{t("col_key")}</span>
        <span className="flex-1 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t("col_visual")}</span>
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t("col_value")}</span>
      </div>

      <AnimatePresence initial={false}>
        {visibleKeys.map((key) => {
          const value = scale[key] ?? ""
          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            >
              <div className="w-32 flex items-center gap-1.5 shrink-0">
                <EditableKey value={key} onRename={(newK) => onRename(key, newK)} />
                <CopyBadge cssVar={`${cssVarPrefix}${key}`} value={value} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                {renderVisual ? renderVisual(key, value) : <div />}
              </div>
              <input
                className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md px-2 py-1 text-xs font-mono text-[var(--foreground)] w-24 text-right focus:outline-none focus:border-[var(--accent)] transition-colors"
                value={value}
                onChange={(e) => onUpdate(key, e.target.value)}
              />
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-[var(--danger)] shrink-0"
                onClick={() => onRemove(key)}
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
              className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md px-2 py-1 text-xs font-mono text-[var(--foreground)] w-24 focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false) }}
            />
            <input
              className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md px-2 py-1 text-xs font-mono text-[var(--foreground)] flex-1 focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder={defaultValue || "value"}
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
        <Plus size={13} /> {addLabel}
      </Button>
    </div>
  )
}
