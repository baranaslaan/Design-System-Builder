"use client"
import type { LayerKind } from "@/types/brands"

const META: Record<LayerKind, { label: string; color: string; bg: string }> = {
  core:            { label: "core",    color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  semantic_global: { label: "sem·g",   color: "#0891b2", bg: "rgba(8,145,178,0.12)" },
  semantic_brand:  { label: "sem·b",   color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
  brand:           { label: "brand",   color: "#db2777", bg: "rgba(219,39,119,0.12)" },
}

export function TokenSourceBadge({ kind, locked }: { kind: LayerKind; locked?: boolean }) {
  const m = META[kind]
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase"
      style={{ color: m.color, background: m.bg }}>
      {locked && <span aria-hidden>🔒</span>}{m.label}
    </span>
  )
}
