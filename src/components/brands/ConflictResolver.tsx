"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/lib/adoption/api"
import type { MergeConflict, MergeConflictEntry } from "@/types/brands"

interface Props { brandId: string; conflicts: MergeConflict[]; onResolved: () => void }

export function ConflictResolver({ brandId, conflicts, onResolved }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [picks, setPicks] = useState<Record<string, "keep_brand" | "accept_core">>({})
  const [busy, setBusy] = useState(false)
  const open = conflicts.filter(c => c.status === "open")
  const active = open.find(c => c.id === activeId) ?? open[0]

  if (open.length === 0) return null

  const submit = async () => {
    if (!active) return
    setBusy(true)
    try {
      const resolutions = active.conflicts.map((c) => ({
        path: c.path, resolution: picks[c.path] ?? "keep_brand",
      }))
      await apiSend(`/api/brands/${brandId}/conflicts/${active.id}`, "POST", { resolutions })
      setPicks({}); setActiveId(null); onResolved()
    } finally { setBusy(false) }
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed bottom-4 right-4 w-full max-w-md bg-[var(--surface)] border border-[var(--danger)] rounded-xl shadow-2xl z-30 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse" />
          <h3 className="text-sm font-semibold">{open.length} core update conflict{open.length === 1 ? "" : "s"}</h3>
          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setActiveId("dismiss")} aria-label="Hide">
            <X size={12} />
          </Button>
        </div>
        {active && activeId !== "dismiss" && (
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
            <p className="text-[11px] text-[var(--muted-foreground)] mb-2">
              Core v{active.core_version_from} → v{active.core_version_to} · pick per path
            </p>
            {active.conflicts.map((c: MergeConflictEntry) => {
              const chosen = picks[c.path] ?? "keep_brand"
              return (
                <div key={c.path} className="p-2.5 bg-[var(--surface-2)] rounded">
                  <code className="block text-[10px] font-mono text-[var(--muted-foreground)] mb-2 break-all">{c.path}</code>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button onClick={() => setPicks(p => ({ ...p, [c.path]: "keep_brand" }))}
                      className={`p-2 rounded border text-left ${chosen === "keep_brand" ? "border-[var(--accent)] bg-[var(--surface)]" : "border-[var(--border)]"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase opacity-70">Keep brand</span>
                        {chosen === "keep_brand" && <Check size={11} className="text-[var(--accent)]" />}
                      </div>
                      <code className="font-mono text-[10px] break-all">{JSON.stringify(c.brand_value)}</code>
                    </button>
                    <button onClick={() => setPicks(p => ({ ...p, [c.path]: "accept_core" }))}
                      className={`p-2 rounded border text-left ${chosen === "accept_core" ? "border-[var(--accent)] bg-[var(--surface)]" : "border-[var(--border)]"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase opacity-70">Accept core</span>
                        {chosen === "accept_core" && <Check size={11} className="text-[var(--accent)]" />}
                      </div>
                      <code className="font-mono text-[10px] break-all">{JSON.stringify(c.new_core)}</code>
                    </button>
                  </div>
                  <p className="mt-1.5 text-[9px] text-[var(--muted-foreground)] flex items-center gap-1">
                    was <code className="font-mono">{JSON.stringify(c.old_core)}</code>
                    <ArrowRight size={9} /> <code className="font-mono">{JSON.stringify(c.new_core)}</code>
                  </p>
                </div>
              )
            })}
            <Button variant="accent" size="sm" onClick={submit} disabled={busy} className="w-full mt-2">
              Apply {Object.keys(picks).length || "default"} resolution{Object.keys(picks).length === 1 ? "" : "s"}
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
