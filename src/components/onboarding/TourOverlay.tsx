"use client"
// Spotlight overlay with rotating step pointer. Pure CSS spotlight uses a
// radial mask over a dark backdrop.
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OnboardingStep } from "@/types/onboarding"

interface Props {
  open: boolean
  step: OnboardingStep | null
  index: number
  total: number
  onNext: () => void
  onClose: () => void
}

export function TourOverlay({ open, step, index, total, onNext, onClose }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!open || !step?.ctaSelector) { setRect(null); return }
    const compute = () => {
      const el = document.querySelector<HTMLElement>(step.ctaSelector!)
      setRect(el?.getBoundingClientRect() ?? null)
    }
    compute()
    window.addEventListener("resize", compute)
    window.addEventListener("scroll", compute, true)
    return () => {
      window.removeEventListener("resize", compute)
      window.removeEventListener("scroll", compute, true)
    }
  }, [open, step?.ctaSelector])

  if (!open || !step) return null

  const pad = 8
  const spot = rect ? { x: rect.left - pad, y: rect.top - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 } : null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none">
        {/* Dim + cutout via SVG mask */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={onClose}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {spot && <rect x={spot.x} y={spot.y} width={spot.w} height={spot.h} rx={10} fill="black" />}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.62)" mask="url(#tour-mask)" />
          {spot && (
            <rect x={spot.x} y={spot.y} width={spot.w} height={spot.h} rx={10}
              fill="none" stroke="var(--accent)" strokeWidth={2}
              style={{ filter: "drop-shadow(0 0 8px var(--accent))" }} />
          )}
        </svg>

        {/* Tooltip card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto absolute w-80 p-4 rounded-xl border border-[var(--accent)] bg-[var(--surface)] shadow-2xl"
          style={spot
            ? { left: Math.min(window.innerWidth - 340, Math.max(20, spot.x)), top: Math.min(window.innerHeight - 200, spot.y + spot.h + 12) }
            : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-[var(--accent)] tabular-nums">{index + 1} / {total}</span>
            <h3 className="text-sm font-semibold flex-1">{step.title}</h3>
            <button onClick={onClose} aria-label="End tour" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><X size={13} /></button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">{step.description}</p>
          <Button variant="accent" size="sm" onClick={onNext} className="gap-1.5 w-full justify-center">
            {index + 1 === total ? "Finish" : "Next"} <ChevronRight size={12} />
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
