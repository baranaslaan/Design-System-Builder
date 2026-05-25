"use client"
// Render a small popover the first time a user sees `id`. Persisted server-side.
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lightbulb } from "lucide-react"
import { useOnboardingStore } from "@/store/onboarding"
import { apiSend } from "@/lib/adoption/api"

export function FirstVisitTooltip({ id, children, label }: {
  id: string; children: React.ReactNode; label: string
}) {
  const seen = useOnboardingStore(s => s.tooltipsSeen.has(id))
  const mark = useOnboardingStore(s => s.markTooltipSeen)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [seen])

  const dismiss = async () => {
    setOpen(false); mark(id)
    try { await apiSend("/api/onboarding/tooltips", "POST", { tooltip_id: id }) } catch { /* offline ok */ }
  }

  return (
    <div className="relative inline-block">
      {children}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute z-30 top-full mt-2 left-0 w-64 p-3 rounded-lg border border-[var(--accent)] bg-[var(--surface)] shadow-xl">
            <div className="flex items-start gap-2">
              <Lightbulb size={13} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[var(--foreground)] flex-1">{label}</p>
              <button onClick={dismiss} aria-label="Dismiss" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X size={12} />
              </button>
            </div>
            <div className="absolute -top-1.5 left-4 w-3 h-3 rotate-45 border-l border-t border-[var(--accent)] bg-[var(--surface)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
