"use client"
// Renders the same set of components twice, each wrapped in a CSS-vars
// scope built from the resolved tokens of two brands.
import type { DesignTokens } from "@/types/tokens"
import { SCORED_VARIANTS } from "@/components/scoring/scoredVariants"

function cssVarsFromTokens(t: DesignTokens): React.CSSProperties {
  const vars: Record<string, string> = {}
  // Semantic colors → --color-*
  for (const sem of t.colors?.semantic ?? []) {
    vars[`--color-${sem.name}`] = sem.lightValue
  }
  // First palette accent
  const primary = (t.colors?.semantic ?? []).find(s => s.name === "primary" || s.name === "accent")
  if (primary) vars["--accent"] = primary.lightValue
  // Spacing
  for (const [k, v] of Object.entries(t.spacing ?? {})) vars[`--spacing-${k}`] = String(v)
  // Radius
  for (const [k, v] of Object.entries(t.radius ?? {}))  vars[`--radius-${k}`]  = String(v)
  // Typography
  if (t.typography?.fontFamilies?.sans) vars["--font-sans"] = t.typography.fontFamilies.sans
  for (const [k, v] of Object.entries(t.typography?.fontSizes ?? {})) vars[`--text-${k}`] = String(v)
  return vars as React.CSSProperties
}

interface PaneProps { label: string; tokens: DesignTokens | null }

function Pane({ label, tokens }: PaneProps) {
  const style = tokens ? cssVarsFromTokens(tokens) : {}
  return (
    <div className="flex-1 min-w-0 border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
      <div className="px-3 py-2 border-b border-[var(--border)] text-[10px] uppercase text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="p-5 space-y-4" style={{ ...style, background: "var(--background)", color: "var(--foreground)" }}>
        {!tokens && <p className="text-xs text-[var(--muted-foreground)] italic">Select a brand</p>}
        {tokens && SCORED_VARIANTS.map(v => (
          <div key={`${v.component_id}-${v.variant}`} className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--muted-foreground)] w-24 truncate">{v.component_id}/{v.variant}</span>
            {v.node}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SideBySidePreview({ leftLabel, rightLabel, leftTokens, rightTokens }: {
  leftLabel: string; rightLabel: string; leftTokens: DesignTokens | null; rightTokens: DesignTokens | null
}) {
  return (
    <div className="flex gap-3">
      <Pane label={leftLabel} tokens={leftTokens} />
      <Pane label={rightLabel} tokens={rightTokens} />
    </div>
  )
}
