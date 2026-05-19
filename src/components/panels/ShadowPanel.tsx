"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Plus } from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { Button } from "@/components/ui/button"
import { CopyBadge } from "@/components/ui/CopyBadge"

export function ShadowPanel({ filter = "" }: { filter?: string }) {
  const { tokens, updateShadow, addShadow, removeShadow } = useTokensStore()
  const q = filter.toLowerCase()
  const visible = tokens.shadows.filter(s => !q || s.name.toLowerCase().includes(q) || s.id.includes(q) || s.value.includes(q))

  const handleAdd = () => {
    addShadow({
      id: `shadow-${Date.now()}`,
      name: "Custom",
      value: "0 4px 12px rgb(0 0 0 / 0.15)",
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {visible.map((shadow) => (
          <motion.div
            key={shadow.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group/shadow flex flex-col gap-3 p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]"
          >
            {/* Preview card */}
            <div className="flex items-center justify-center h-20 bg-[var(--background)] rounded-lg">
              <div
                className="w-20 h-12 rounded-xl bg-[var(--surface-3)] border border-[var(--border)] transition-all duration-200"
                style={{ boxShadow: shadow.value }}
              />
            </div>

            {/* Name & controls */}
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-transparent text-sm font-semibold text-[var(--foreground)] focus:outline-none border-b border-transparent focus:border-[var(--accent)] pb-0.5 transition-colors"
                value={shadow.name}
                onChange={(e) => updateShadow({ ...shadow, name: e.target.value })}
                placeholder="Shadow name"
              />
              <CopyBadge cssVar={`--shadow-${shadow.id}`} value={shadow.value} className="opacity-0 group-hover/shadow:opacity-100 transition-opacity" />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-400"
                onClick={() => removeShadow(shadow.id)}
              >
                <Trash2 size={13} />
              </Button>
            </div>

            <textarea
              className="w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--foreground)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors leading-relaxed"
              rows={2}
              value={shadow.value}
              onChange={(e) => updateShadow({ ...shadow, value: e.target.value })}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <Button variant="ghost" size="sm" onClick={handleAdd} className="w-full justify-start gap-2 text-[var(--muted)]">
        <Plus size={13} /> Add shadow
      </Button>
    </div>
  )
}
