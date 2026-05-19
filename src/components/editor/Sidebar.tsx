"use client"

import { motion } from "framer-motion"
import {
  Palette, Type, Space, Circle, Minus, BoxSelect, Layers, Blend
} from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import type { TokenCategory } from "@/types/tokens"

const CATEGORIES: { key: TokenCategory; label: string; icon: React.ReactNode; count: (s: ReturnType<typeof useTokensStore.getState>["tokens"]) => number }[] = [
  {
    key: "colors",
    label: "Colors",
    icon: <Palette size={15} />,
    count: (t) => t.colors.palettes.length + t.colors.semantic.length,
  },
  {
    key: "typography",
    label: "Typography",
    icon: <Type size={15} />,
    count: (t) => Object.keys(t.typography.fontSizes).length,
  },
  {
    key: "spacing",
    label: "Spacing",
    icon: <Space size={15} />,
    count: (t) => Object.keys(t.spacing).length,
  },
  {
    key: "radius",
    label: "Radius",
    icon: <Circle size={15} />,
    count: (t) => Object.keys(t.radius).length,
  },
  {
    key: "stroke",
    label: "Stroke",
    icon: <Minus size={15} />,
    count: (t) => Object.keys(t.stroke).length,
  },
  {
    key: "shadow",
    label: "Shadows",
    icon: <BoxSelect size={15} />,
    count: (t) => t.shadows.length,
  },
  {
    key: "gradient",
    label: "Gradients",
    icon: <Blend size={15} />,
    count: (t) => t.gradients?.length ?? 0,
  },
]

export function Sidebar() {
  const { activeCategory, setActiveCategory, tokens } = useTokensStore()

  return (
    <nav className="w-52 flex-shrink-0 flex flex-col gap-0.5 py-4 px-2 border-r border-[var(--border)]">
      {CATEGORIES.map(({ key, label, icon, count }) => {
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
            <span className="relative z-10 flex-shrink-0" style={{ color: isActive ? "var(--accent)" : undefined }}>
              {icon}
            </span>
            <span className="relative z-10 text-sm font-medium flex-1">{label}</span>
            <span
              className="relative z-10 text-[10px] font-mono rounded-full px-1.5 py-0.5"
              style={{
                background: isActive ? "var(--accent-muted)" : "var(--surface-3)",
                color: isActive ? "#a78bfa" : "var(--muted)",
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
