import type { DesignTokens, TokenCategory } from "@/types/tokens"

export type SearchResultKind =
  | "palette-color"
  | "semantic-color"
  | "font-size"
  | "font-weight"
  | "font-family"
  | "line-height"
  | "spacing"
  | "radius"
  | "stroke"
  | "shadow"
  | "gradient"

export interface SearchResult {
  id: string
  category: TokenCategory
  kind: SearchResultKind
  label: string
  subLabel: string
  value: string
  colorValue?: string
}

export function buildSearchIndex(tokens: DesignTokens): SearchResult[] {
  const results: SearchResult[] = []

  for (const palette of tokens.colors.palettes) {
    for (const [shade, hex] of Object.entries(palette.shades)) {
      results.push({
        id: `color-${palette.id}-${shade}`,
        category: "colors",
        kind: "palette-color",
        label: `${palette.name} ${shade}`,
        subLabel: `Colors › ${palette.name}`,
        value: hex,
        colorValue: hex,
      })
    }
  }

  for (const c of tokens.colors.semantic) {
    results.push({
      id: `semantic-${c.id}`,
      category: "colors",
      kind: "semantic-color",
      label: c.name,
      subLabel: "Colors › Semantic",
      value: c.lightRef ?? c.lightValue,
      colorValue: c.lightValue,
    })
  }

  for (const [k, v] of Object.entries(tokens.typography.fontSizes)) {
    results.push({
      id: `font-size-${k}`,
      category: "typography",
      kind: "font-size",
      label: k,
      subLabel: "Typography › Font Size",
      value: v,
    })
  }

  for (const [k, v] of Object.entries(tokens.typography.fontWeights)) {
    results.push({
      id: `font-weight-${k}`,
      category: "typography",
      kind: "font-weight",
      label: k,
      subLabel: "Typography › Font Weight",
      value: String(v),
    })
  }

  for (const [k, v] of Object.entries(tokens.typography.lineHeights)) {
    results.push({
      id: `line-height-${k}`,
      category: "typography",
      kind: "line-height",
      label: k,
      subLabel: "Typography › Line Height",
      value: v,
    })
  }

  for (const [k, v] of Object.entries(tokens.typography.fontFamilies)) {
    results.push({
      id: `font-family-${k}`,
      category: "typography",
      kind: "font-family",
      label: k,
      subLabel: "Typography › Font Family",
      value: v,
    })
  }

  for (const [k, v] of Object.entries(tokens.spacing)) {
    results.push({
      id: `spacing-${k}`,
      category: "spacing",
      kind: "spacing",
      label: `spacing-${k}`,
      subLabel: "Spacing",
      value: v,
    })
  }

  for (const [k, v] of Object.entries(tokens.radius)) {
    results.push({
      id: `radius-${k}`,
      category: "radius",
      kind: "radius",
      label: `radius-${k}`,
      subLabel: "Border Radius",
      value: v,
    })
  }

  for (const [k, v] of Object.entries(tokens.stroke)) {
    results.push({
      id: `stroke-${k}`,
      category: "stroke",
      kind: "stroke",
      label: `stroke-${k}`,
      subLabel: "Stroke Width",
      value: v,
    })
  }

  for (const s of tokens.shadows) {
    results.push({
      id: `shadow-${s.id}`,
      category: "shadow",
      kind: "shadow",
      label: s.name,
      subLabel: "Shadows",
      value: s.value,
    })
  }

  for (const g of tokens.gradients ?? []) {
    results.push({
      id: `gradient-${g.id}`,
      category: "gradient",
      kind: "gradient",
      label: g.name,
      subLabel: `Gradients › ${g.type}`,
      value: `${g.angle}° · ${g.stops.length} stops`,
    })
  }

  return results
}

export function searchTokens(
  index: SearchResult[],
  query: string,
  categoryFilter?: TokenCategory | null,
): SearchResult[] {
  const q = query.toLowerCase().trim()
  let results = index

  if (categoryFilter) results = results.filter((r) => r.category === categoryFilter)
  if (!q) return results

  return results.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      r.value.toLowerCase().includes(q) ||
      r.subLabel.toLowerCase().includes(q),
  )
}

export function groupByCategory(results: SearchResult[]): Map<TokenCategory, SearchResult[]> {
  const map = new Map<TokenCategory, SearchResult[]>()
  for (const r of results) {
    if (!map.has(r.category)) map.set(r.category, [])
    map.get(r.category)!.push(r)
  }
  return map
}
