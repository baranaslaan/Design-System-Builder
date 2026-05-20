"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTokensStore } from "@/store/tokens"
import { useT } from "@/lib/i18n"
import { ScalePanel } from "./ScalePanel"

export function MotionPanel({ filter = "" }: { filter?: string }) {
  const {
    tokens,
    updateMotionDuration, addMotionDuration, removeMotionDuration, renameMotionDuration,
    updateMotionEasing,   addMotionEasing,   removeMotionEasing,   renameMotionEasing,
  } = useTokensStore()
  const t = useT()

  // Ping animations so the user sees curves in motion
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 2200)
    return () => clearInterval(id)
  }, [])

  const allDurations = Object.values(tokens.motion?.durations ?? {}).map((v) => parseInt(v) || 0)
  const maxDuration = Math.max(...allDurations, 1000)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Durations ───────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-2 px-3">{t("section_durations")}</p>
        <ScalePanel
          scale={tokens.motion?.durations ?? {}}
          cssVarPrefix="--motion-duration-"
          filter={filter}
          defaultValue="200ms"
          addLabel={t("btn_add_duration")}
          onUpdate={updateMotionDuration}
          onAdd={addMotionDuration}
          onRemove={removeMotionDuration}
          onRename={renameMotionDuration}
          sort={(a, b, s) => (parseInt(s[a]) || 0) - (parseInt(s[b]) || 0)}
          renderVisual={(_, value) => {
            const ms = parseInt(value) || 0
            const ratio = Math.min(ms / maxDuration, 1)
            return (
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <motion.div
                    key={`d-${value}-${tick}`}
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${ratio * 100}%` }}
                    transition={{ duration: ms / 1000, ease: "linear" }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--muted)] w-12 text-right">{ms}ms</span>
              </div>
            )
          }}
        />
      </div>

      {/* ── Easings ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-2 px-3">{t("section_easings")}</p>
        <ScalePanel
          scale={tokens.motion?.easings ?? {}}
          cssVarPrefix="--motion-easing-"
          filter={filter}
          defaultValue="cubic-bezier(0.4, 0, 0.2, 1)"
          addLabel={t("btn_add_easing")}
          onUpdate={updateMotionEasing}
          onAdd={addMotionEasing}
          onRemove={removeMotionEasing}
          onRename={renameMotionEasing}
          renderVisual={(_, value) => {
            const easing = value || "linear"
            return (
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 h-7 bg-[var(--surface-3)] rounded-md overflow-hidden">
                  <motion.div
                    key={`e-${value}-${tick}`}
                    initial={{ x: "0%" }}
                    animate={{ x: "calc(100% - 14px)" }}
                    transition={{ duration: 1.2, ease: parseEasing(easing) as never }}
                    className="absolute top-1/2 -translate-y-1/2 left-1 w-3 h-3 rounded-full bg-[var(--accent)]"
                  />
                </div>
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}

// Try to parse a CSS cubic-bezier(...) string into framer-motion ease array
function parseEasing(value: string): [number, number, number, number] | string {
  const m = value.match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/)
  if (m) return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])]
  if (/^(linear|easeIn|easeOut|easeInOut|circIn|circOut|circInOut|backIn|backOut|backInOut|anticipate|bounceIn|bounceOut|bounceInOut)$/.test(value)) {
    return value
  }
  return "easeInOut"
}
