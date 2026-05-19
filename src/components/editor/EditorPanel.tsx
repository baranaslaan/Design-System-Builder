"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, X } from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { ColorsPanel } from "@/components/panels/ColorsPanel"
import { TypographyPanel } from "@/components/panels/TypographyPanel"
import { SpacingPanel } from "@/components/panels/SpacingPanel"
import { RadiusPanel } from "@/components/panels/RadiusPanel"
import { StrokePanel } from "@/components/panels/StrokePanel"
import { ShadowPanel } from "@/components/panels/ShadowPanel"
import { GradientsPanel } from "@/components/panels/GradientsPanel"

const PANEL_TITLES: Record<string, string> = {
  colors:     "Colors",
  typography: "Typography",
  spacing:    "Spacing",
  radius:     "Border Radius",
  stroke:     "Stroke Width",
  shadow:     "Shadows",
  gradient:   "Gradients",
}

export function EditorPanel() {
  const { activeCategory } = useTokensStore()
  const [filter, setFilter] = useState("")

  // Clear filter when switching categories
  useEffect(() => { setFilter("") }, [activeCategory])

  const panels: Record<string, React.ReactNode> = {
    colors:     <ColorsPanel filter={filter} />,
    typography: <TypographyPanel filter={filter} />,
    spacing:    <SpacingPanel filter={filter} />,
    radius:     <RadiusPanel filter={filter} />,
    stroke:     <StrokePanel filter={filter} />,
    shadow:     <ShadowPanel filter={filter} />,
    gradient:   <GradientsPanel filter={filter} />,
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 border-r border-[var(--border)]">
      {/* Panel header */}
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.h2
            key={activeCategory}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm font-semibold text-[var(--foreground)] flex-shrink-0"
          >
            {PANEL_TITLES[activeCategory]}
          </motion.h2>
        </AnimatePresence>

        {/* Inline search */}
        <div className="flex-1 flex items-center gap-2 bg-[var(--surface-2)] rounded-lg px-2.5 py-1.5 border border-transparent focus-within:border-[var(--accent)] transition-colors">
          <Search size={12} className="text-[var(--muted)] flex-shrink-0" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder={`Filter ${PANEL_TITLES[activeCategory].toLowerCase()}…`}
            className="flex-1 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none min-w-0"
          />
          <AnimatePresence>
            {filter && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setFilter("")}
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
              >
                <X size={11} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {panels[activeCategory]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
