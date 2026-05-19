import type { DesignTokens } from "@/types/tokens"

export type DiffType = "added" | "removed" | "changed"

export interface DiffEntry {
  category: string
  key: string
  type: DiffType
  before?: string
  after?: string
}

function flattenTokens(tokens: DesignTokens): Record<string, string> {
  const out: Record<string, string> = {}

  // Colors — palettes
  for (const palette of tokens.colors.palettes) {
    for (const [shade, hex] of Object.entries(palette.shades)) {
      out[`color.${palette.id}.${shade}`] = hex
    }
  }

  // Colors — semantic
  for (const sem of tokens.colors.semantic) {
    out[`semantic.${sem.id}.light`] = sem.lightValue
    out[`semantic.${sem.id}.dark`] = sem.darkValue
  }

  // Typography
  for (const [k, v] of Object.entries(tokens.typography.fontSizes)) {
    out[`font-size.${k}`] = String(v)
  }
  for (const [k, v] of Object.entries(tokens.typography.fontWeights)) {
    out[`font-weight.${k}`] = String(v)
  }
  for (const [k, v] of Object.entries(tokens.typography.lineHeights)) {
    out[`line-height.${k}`] = String(v)
  }
  out["font-family.sans"] = tokens.typography.fontFamilies.sans
  out["font-family.serif"] = tokens.typography.fontFamilies.serif
  out["font-family.mono"] = tokens.typography.fontFamilies.mono

  // Spacing / Radius / Stroke
  for (const [k, v] of Object.entries(tokens.spacing)) out[`spacing.${k}`] = String(v)
  for (const [k, v] of Object.entries(tokens.radius)) out[`radius.${k}`] = String(v)
  for (const [k, v] of Object.entries(tokens.stroke)) out[`stroke.${k}`] = String(v)

  // Shadows
  for (const s of tokens.shadows) {
    out[`shadow.${s.id}`] = s.value
  }

  // Gradients
  for (const g of tokens.gradients ?? []) {
    out[`gradient.${g.id}`] = `${g.type} ${g.angle}deg ${g.stops.map(s => s.color).join(" → ")}`
  }

  return out
}

const CATEGORY_LABELS: Record<string, string> = {
  color: "Color Palettes",
  semantic: "Semantic Colors",
  "font-size": "Font Sizes",
  "font-weight": "Font Weights",
  "line-height": "Line Heights",
  "font-family": "Font Families",
  spacing: "Spacing",
  radius: "Radius",
  stroke: "Stroke",
  shadow: "Shadows",
  gradient: "Gradients",
}

export interface DiffGroup {
  category: string
  label: string
  entries: DiffEntry[]
}

export function diffTokens(before: DesignTokens, after: DesignTokens): DiffGroup[] {
  const flatBefore = flattenTokens(before)
  const flatAfter = flattenTokens(after)

  const allKeys = new Set([...Object.keys(flatBefore), ...Object.keys(flatAfter)])
  const entries: DiffEntry[] = []

  for (const key of allKeys) {
    const b = flatBefore[key]
    const a = flatAfter[key]
    if (b === a) continue

    const category = key.split(".")[0]
    if (b === undefined) {
      entries.push({ category, key, type: "added", after: a })
    } else if (a === undefined) {
      entries.push({ category, key, type: "removed", before: b })
    } else {
      entries.push({ category, key, type: "changed", before: b, after: a })
    }
  }

  // Group by category
  const grouped: Record<string, DiffEntry[]> = {}
  for (const entry of entries) {
    if (!grouped[entry.category]) grouped[entry.category] = []
    grouped[entry.category].push(entry)
  }

  return Object.entries(grouped)
    .map(([cat, items]) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      entries: items.sort((a, b) => a.key.localeCompare(b.key)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category))
}

export function diffSummary(groups: DiffGroup[]) {
  let added = 0, removed = 0, changed = 0
  for (const g of groups) {
    for (const e of g.entries) {
      if (e.type === "added") added++
      else if (e.type === "removed") removed++
      else changed++
    }
  }
  return { added, removed, changed, total: added + removed + changed }
}
