"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { CopyBadge } from "@/components/ui/CopyBadge"
import { EditableKey } from "@/components/ui/EditableKey"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

export function RadiusPanel({ filter = "" }: { filter?: string }) {
  const { tokens, updateRadius, renameRadius, addRadius, removeRadius } = useTokensStore()
  const t = useT()
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("8px")
  const q = filter.toLowerCase()

  const allKeys = Object.keys(tokens.radius)
  const visible = allKeys.filter((key) => !q || key.includes(q) || tokens.radius[key].includes(q))

  const handleAdd = () => {
    const k = newKey.trim()
    if (!k) return
    addRadius(k, newValue)
    setNewKey("")
    setNewValue("8px")
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <AnimatePresence initial={false}>
          {visible.map((key) => {
            const value = tokens.radius[key]
            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                className="group/card flex flex-col gap-2 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] relative"
              >
                <button
                  className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-400"
                  onClick={() => removeRadius(key)}
                  title={t("btn_remove")}
                >
                  <Trash2 size={11} />
                </button>
                <div className="flex items-center justify-center h-16">
                  <div
                    className="w-12 h-12 border-2 border-[var(--accent)] bg-[var(--accent-muted)] transition-all duration-200"
                    style={{ borderRadius: value === "9999px" ? "50%" : value }}
                  />
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    <EditableKey value={key} onRename={(newK) => renameRadius(key, newK)} className="text-xs font-semibold" />
                  </div>
                  <div className="flex justify-center mt-1 mb-0.5">
                    <CopyBadge cssVar={`--radius-${key}`} value={value} />
                  </div>
                  <input
                    className="mt-1 w-full bg-transparent text-xs font-mono text-[var(--muted)] text-center focus:outline-none focus:text-[var(--foreground)] transition-colors"
                    value={value}
                    onChange={(e) => updateRadius(key, e.target.value)}
                  />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

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
        <Plus size={13} /> {t("btn_add_radius")}
      </Button>
    </div>
  )
}
