"use client"

import { motion } from "framer-motion"
import {
  Palette, Type, Space, Circle, Minus, BoxSelect, Layers, Blend,
  Zap, Droplets, Monitor, CircleDashed,
} from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { useT, type StringKey } from "@/lib/i18n"
import type { TokenCategory } from "@/types/tokens"

const CATEGORIES: { key: TokenCategory; labelKey: StringKey; icon: React.ReactNode; count: (s: ReturnType<typeof useTokensStore.getState>["tokens"]) => number }[] = [
  {
    key: "colors",
    labelKey: "cat_colors",
    icon: <Palette size={15} />,
    count: (t) => t.colors.palettes.length + t.colors.semantic.length,
  },
  {
    key: "typography",
    labelKey: "cat_typography",
    icon: <Type size={15} />,
    count: (t) => Object.keys(t.typography.fontSizes).length,
  },
  {
    key: "spacing",
    labelKey: "cat_spacing",
    icon: <Space size={15} />,
    count: (t) => Object.keys(t.spacing).length,
  },
  {
    key: "radius",
    labelKey: "cat_radius",
    icon: <Circle size={15} />,
    count: (t) => Object.keys(t.radius).length,
  },
  {
    key: "stroke",
    labelKey: "cat_stroke",
    icon: <Minus size={15} />,
    count: (t) => Object.keys(t.stroke).length,
  },
  {
    key: "shadow",
    labelKey: "cat_shadows",
    icon: <BoxSelect size={15} />,
    count: (t) => t.shadows.length,
  },
  {
    key: "gradient",
    labelKey: "cat_gradients",
    icon: <Blend size={15} />,
    count: (t) => t.gradients?.length ?? 0,
  },
  {
    key: "motion",
    labelKey: "cat_motion",
    icon: <Zap size={15} />,
    count: (t) => (Object.keys(t.motion?.durations ?? {}).length) + (Object.keys(t.motion?.easings ?? {}).length),
  },
  {
    key: "opacity",
    labelKey: "cat_opacity",
    icon: <Droplets size={15} />,
    count: (t) => Object.keys(t.opacity ?? {}).length,
  },
  {
    key: "breakpoint",
    labelKey: "cat_breakpoints",
    icon: <Monitor size={15} />,
    count: (t) => Object.keys(t.breakpoints ?? {}).length,
  },
  {
    key: "zindex",
    labelKey: "cat_zindex",
    icon: <Layers size={15} />,
    count: (t) => Object.keys(t.zIndex ?? {}).length,
  },
  {
    key: "blur",
    labelKey: "cat_blur",
    icon: <CircleDashed size={15} />,
    count: (t) => Object.keys(t.blur ?? {}).length,
  },
]

export function Sidebar() {
  const { activeCategory, setActiveCategory, tokens } = useTokensStore()
  const t = useT()

  return (
    <nav className="w-52 flex-shrink-0 flex flex-col gap-0.5 py-4 px-2 border-r border-[var(--border)]">
      {CATEGORIES.map(({ key, labelKey, icon, count }) => {
        const label = t(labelKey)
        const isActive = activeCategory === key
        return (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
            style={{
              color: isActive ? "var(--foreground)" : "var(--muted)",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]"
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              />
            )}
            {/* Accent bar on active — adds primary affordance */}
            {isActive && (
              <motion.div
                layoutId="sidebar-active-bar"
                className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-[var(--accent)]"
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex-shrink-0" style={{ color: isActive ? "var(--accent)" : undefined }}>
              {icon}
            </span>
            <span className={`relative z-10 text-sm flex-1 ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
            <span
              className="relative z-10 text-[10px] font-mono rounded-full px-1.5 py-0.5"
              style={{
                background: isActive ? "var(--accent-muted)" : "var(--surface-3)",
                color: isActive ? "var(--accent)" : "var(--muted)",
              }}
            >
              {count(tokens)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
