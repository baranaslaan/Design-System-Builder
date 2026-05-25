import type { DesignTokens, FigmaTokensFormat } from "@/types/tokens"
import { resolveRef, gradientToCss } from "./utils"

// ─── CSS Custom Properties ────────────────────────────────────────────────
export function exportToCSSVariables(tokens: DesignTokens): string {
  const lines: string[] = [`/* ${tokens.name} v${tokens.version} */`, ""]

  lines.push(":root {")
  lines.push("  /* Color Palettes */")
  for (const palette of tokens.colors.palettes) {
    for (const [shade, value] of Object.entries(palette.shades))
      lines.push(`  --color-${palette.id}-${shade}: ${value};`)
  }
  lines.push("\n  /* Semantic Colors — Light */")
  for (const c of tokens.colors.semantic) {
    const val = c.lightRef ? (resolveRef(c.lightRef, tokens.colors.palettes) ?? c.lightValue) : c.lightValue
    const ref = c.lightRef ? ` /* ${c.lightRef} */` : ""
    lines.push(`  --color-${c.id}: ${val};${ref}`)
  }
  lines.push("\n  /* Typography */")
  for (const [k, v] of Object.entries(tokens.typography.fontSizes))    lines.push(`  --font-size-${k}: ${v};`)
  for (const [k, v] of Object.entries(tokens.typography.fontWeights))  lines.push(`  --font-weight-${k}: ${v};`)
  for (const [k, v] of Object.entries(tokens.typography.lineHeights))  lines.push(`  --line-height-${k}: ${v};`)
  for (const [k, v] of Object.entries(tokens.typography.fontFamilies)) lines.push(`  --font-family-${k}: ${v};`)
  lines.push("\n  /* Spacing */")
  for (const [k, v] of Object.entries(tokens.spacing))  lines.push(`  --spacing-${k}: ${v};`)
  lines.push("\n  /* Border Radius */")
  for (const [k, v] of Object.entries(tokens.radius))   lines.push(`  --radius-${k}: ${v};`)
  lines.push("\n  /* Stroke Width */")
  for (const [k, v] of Object.entries(tokens.stroke))   lines.push(`  --stroke-${k}: ${v};`)
  lines.push("\n  /* Shadows */")
  for (const s of tokens.shadows) lines.push(`  --shadow-${s.id}: ${s.value};`)
  if (tokens.gradients?.length) {
    lines.push("\n  /* Gradients */")
    for (const g of tokens.gradients) lines.push(`  --gradient-${g.id}: ${gradientToCss(g)};`)
  }
  lines.push("}")

  lines.push("\n.dark, [data-theme=\"dark\"] {")
  lines.push("  /* Semantic Colors — Dark */")
  for (const c of tokens.colors.semantic) {
    const val = c.darkRef ? (resolveRef(c.darkRef, tokens.colors.palettes) ?? c.darkValue) : c.darkValue
    const ref = c.darkRef ? ` /* ${c.darkRef} */` : ""
    lines.push(`  --color-${c.id}: ${val};${ref}`)
  }
  lines.push("}")

  lines.push("\n@media (prefers-color-scheme: dark) {")
  lines.push("  :root:not([data-theme]) {")
  for (const c of tokens.colors.semantic) {
    const val = c.darkRef ? (resolveRef(c.darkRef, tokens.colors.palettes) ?? c.darkValue) : c.darkValue
    lines.push(`    --color-${c.id}: ${val};`)
  }
  lines.push("  }\n}")

  return lines.join("\n")
}

// ─── SCSS Variables ───────────────────────────────────────────────────────
export function exportToSCSS(tokens: DesignTokens): string {
  const lines: string[] = [`// ${tokens.name} v${tokens.version}`, ""]

  lines.push("// Color Palettes")
  for (const palette of tokens.colors.palettes) {
    for (const [shade, value] of Object.entries(palette.shades))
      lines.push(`$color-${palette.id}-${shade}: ${value};`)
  }
  lines.push("\n// Semantic Colors — Light")
  for (const c of tokens.colors.semantic) {
    const val = c.lightRef ? (resolveRef(c.lightRef, tokens.colors.palettes) ?? c.lightValue) : c.lightValue
    lines.push(`$color-${c.id}: ${val};`)
  }
  lines.push("\n// Semantic Colors — Dark (use in [data-theme=dark])")
  for (const c of tokens.colors.semantic) {
    const val = c.darkRef ? (resolveRef(c.darkRef, tokens.colors.palettes) ?? c.darkValue) : c.darkValue
    lines.push(`$color-${c.id}-dark: ${val};`)
  }
  lines.push("\n// Typography")
  for (const [k, v] of Object.entries(tokens.typography.fontSizes))    lines.push(`$font-size-${k}: ${v};`)
  for (const [k, v] of Object.entries(tokens.typography.fontWeights))  lines.push(`$font-weight-${k}: ${v};`)
  for (const [k, v] of Object.entries(tokens.typography.lineHeights))  lines.push(`$line-height-${k}: ${v};`)
  for (const [k, v] of Object.entries(tokens.typography.fontFamilies)) lines.push(`$font-family-${k}: ${v};`)
  lines.push("\n// Spacing")
  for (const [k, v] of Object.entries(tokens.spacing)) lines.push(`$spacing-${k}: ${v};`)
  lines.push("\n// Border Radius")
  for (const [k, v] of Object.entries(tokens.radius)) lines.push(`$radius-${k}: ${v};`)
  lines.push("\n// Stroke Width")
  for (const [k, v] of Object.entries(tokens.stroke)) lines.push(`$stroke-${k}: ${v};`)
  lines.push("\n// Shadows")
  for (const s of tokens.shadows) lines.push(`$shadow-${s.id}: ${s.value};`)
  if (tokens.gradients?.length) {
    lines.push("\n// Gradients")
    for (const g of tokens.gradients) lines.push(`$gradient-${g.id}: ${gradientToCss(g)};`)
  }

  return lines.join("\n")
}

// ─── Tailwind Config ──────────────────────────────────────────────────────
export function exportToTailwind(tokens: DesignTokens): string {
  const colors: Record<string, Record<string, string> | string> = {}
  for (const palette of tokens.colors.palettes) {
    colors[palette.id] = {}
    for (const [shade, value] of Object.entries(palette.shades))
      (colors[palette.id] as Record<string, string>)[shade] = value
  }
  for (const c of tokens.colors.semantic) {
    const lv = c.lightRef ? (resolveRef(c.lightRef, tokens.colors.palettes) ?? c.lightValue) : c.lightValue
    colors[c.id] = lv
  }

  const fontSizeEntries: Record<string, [string, { lineHeight: string }]> = {}
  const fsKeys = Object.keys(tokens.typography.fontSizes) as (keyof typeof tokens.typography.fontSizes)[]
  const lhKeys = Object.keys(tokens.typography.lineHeights) as (keyof typeof tokens.typography.lineHeights)[]
  for (const k of fsKeys) {
    fontSizeEntries[k] = [tokens.typography.fontSizes[k], { lineHeight: tokens.typography.lineHeights.normal }]
  }

  const spacing: Record<string, string> = {}
  for (const [k, v] of Object.entries(tokens.spacing)) spacing[k] = v

  const borderRadius: Record<string, string> = {}
  for (const [k, v] of Object.entries(tokens.radius)) borderRadius[k === "base" ? "DEFAULT" : k] = v

  const borderWidth: Record<string, string> = {}
  for (const [k, v] of Object.entries(tokens.stroke)) borderWidth[k === "1" ? "DEFAULT" : k] = v

  const boxShadow: Record<string, string> = {}
  for (const s of tokens.shadows) boxShadow[s.id === "base" ? "DEFAULT" : s.id] = s.value

  const fontFamily: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(tokens.typography.fontFamilies))
    fontFamily[k] = v.split(",").map(f => f.trim())

  const fontWeight: Record<string, string> = {}
  for (const [k, v] of Object.entries(tokens.typography.fontWeights)) fontWeight[k] = String(v)

  const config = {
    theme: {
      extend: {
        colors,
        fontFamily,
        fontSize: fontSizeEntries,
        fontWeight,
        spacing,
        borderRadius,
        borderWidth,
        boxShadow,
      },
    },
  }

  return `// ${tokens.name} v${tokens.version} — Tailwind CSS Config\n/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: ${JSON.stringify(config.theme.extend, null, 4).replace(/"([^"]+)":/g, "$1:")}\n  }\n}`
}

// ─── Style Dictionary ─────────────────────────────────────────────────────
export function exportToStyleDictionary(tokens: DesignTokens): string {
  const result: Record<string, unknown> = {}

  result["color"] = {}
  for (const palette of tokens.colors.palettes) {
    ;(result["color"] as Record<string, unknown>)[palette.id] = {}
    for (const [shade, value] of Object.entries(palette.shades)) {
      ;((result["color"] as Record<string, unknown>)[palette.id] as Record<string, unknown>)[shade] = { value, type: "color" }
    }
  }
  ;(result["color"] as Record<string, unknown>)["semantic"] = {}
  for (const c of tokens.colors.semantic) {
    const lv = c.lightRef ? (resolveRef(c.lightRef, tokens.colors.palettes) ?? c.lightValue) : c.lightValue
    ;((result["color"] as Record<string, unknown>)["semantic"] as Record<string, unknown>)[c.id] = {
      value: lv, type: "color",
      ...(c.lightRef ? { comment: `alias: ${c.lightRef}` } : {}),
    }
  }

  const fsNode: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(tokens.typography.fontSizes)) fsNode[k] = { value: v, type: "dimension" }
  result["fontSize"] = fsNode

  const fwNode: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(tokens.typography.fontWeights)) fwNode[k] = { value: v, type: "fontWeight" }
  result["fontWeight"] = fwNode

  const spNode: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(tokens.spacing)) spNode[`space${k}`] = { value: v, type: "dimension" }
  result["spacing"] = spNode

  const brNode: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(tokens.radius)) brNode[k] = { value: v, type: "dimension" }
  result["borderRadius"] = brNode

  const bwNode: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(tokens.stroke)) bwNode[k === "0" ? "none" : k] = { value: v, type: "dimension" }
  result["borderWidth"] = bwNode

  const shNode: Record<string, unknown> = {}
  for (const sh of tokens.shadows) shNode[sh.id] = { value: sh.value, type: "shadow" }
  result["shadow"] = shNode

  return JSON.stringify(result, null, 2)
}

// ─── Section-filtered CSS ────────────────────────────────────────────────
export type ExportSection = "all" | "colors" | "typography" | "spacing" | "radius" | "stroke" | "shadows" | "gradients"

export function exportSectionToCSS(tokens: DesignTokens, section: ExportSection): string {
  if (section === "all") return exportToCSSVariables(tokens)
  const lines: string[] = []

  if (section === "colors") {
    lines.push(":root {")
    lines.push("  /* Color Palettes */")
    for (const palette of tokens.colors.palettes)
      for (const [shade, value] of Object.entries(palette.shades))
        lines.push(`  --color-${palette.id}-${shade}: ${value};`)
    lines.push("\n  /* Semantic Colors — Light */")
    for (const c of tokens.colors.semantic) {
      const val = c.lightRef ? (resolveRef(c.lightRef, tokens.colors.palettes) ?? c.lightValue) : c.lightValue
      lines.push(`  --color-${c.id}: ${val};`)
    }
    lines.push("}\n\n.dark, [data-theme=\"dark\"] {")
    for (const c of tokens.colors.semantic) {
      const val = c.darkRef ? (resolveRef(c.darkRef, tokens.colors.palettes) ?? c.darkValue) : c.darkValue
      lines.push(`  --color-${c.id}: ${val};`)
    }
    lines.push("}")
  }
  if (section === "typography") {
    lines.push(":root {")
    for (const [k, v] of Object.entries(tokens.typography.fontSizes))    lines.push(`  --font-size-${k}: ${v};`)
    for (const [k, v] of Object.entries(tokens.typography.fontWeights))  lines.push(`  --font-weight-${k}: ${v};`)
    for (const [k, v] of Object.entries(tokens.typography.lineHeights))  lines.push(`  --line-height-${k}: ${v};`)
    for (const [k, v] of Object.entries(tokens.typography.fontFamilies)) lines.push(`  --font-family-${k}: ${v};`)
    lines.push("}")
  }
  if (section === "spacing") {
    lines.push(":root {")
    for (const [k, v] of Object.entries(tokens.spacing)) lines.push(`  --spacing-${k}: ${v};`)
    lines.push("}")
  }
  if (section === "radius") {
    lines.push(":root {")
    for (const [k, v] of Object.entries(tokens.radius)) lines.push(`  --radius-${k}: ${v};`)
    lines.push("}")
  }
  if (section === "stroke") {
    lines.push(":root {")
    for (const [k, v] of Object.entries(tokens.stroke)) lines.push(`  --stroke-${k}: ${v};`)
    lines.push("}")
  }
  if (section === "shadows") {
    lines.push(":root {")
    for (const s of tokens.shadows) lines.push(`  --shadow-${s.id}: ${s.value};`)
    lines.push("}")
  }
  if (section === "gradients" && tokens.gradients?.length) {
    lines.push(":root {")
    for (const g of tokens.gradients) lines.push(`  --gradient-${g.id}: ${gradientToCss(g)};`)
    lines.push("}")
  }
  return lines.join("\n")
}

export function exportSectionToSCSS(tokens: DesignTokens, section: ExportSection): string {
  if (section === "all") return exportToSCSS(tokens)
  const lines: string[] = []

  if (section === "colors") {
    lines.push("// Color Palettes")
    for (const palette of tokens.colors.palettes)
      for (const [shade, value] of Object.entries(palette.shades))
        lines.push(`$color-${palette.id}-${shade}: ${value};`)
    lines.push("\n// Semantic Colors")
    for (const c of tokens.colors.semantic) {
      const val = c.lightRef ? (resolveRef(c.lightRef, tokens.colors.palettes) ?? c.lightValue) : c.lightValue
      lines.push(`$color-${c.id}: ${val};`)
    }
  }
  if (section === "typography") {
    for (const [k, v] of Object.entries(tokens.typography.fontSizes))    lines.push(`$font-size-${k}: ${v};`)
    for (const [k, v] of Object.entries(tokens.typography.fontWeights))  lines.push(`$font-weight-${k}: ${v};`)
    for (const [k, v] of Object.entries(tokens.typography.lineHeights))  lines.push(`$line-height-${k}: ${v};`)
    for (const [k, v] of Object.entries(tokens.typography.fontFamilies)) lines.push(`$font-family-${k}: ${v};`)
  }
  if (section === "spacing")
    for (const [k, v] of Object.entries(tokens.spacing)) lines.push(`$spacing-${k}: ${v};`)
  if (section === "radius")
    for (const [k, v] of Object.entries(tokens.radius)) lines.push(`$radius-${k}: ${v};`)
  if (section === "stroke")
    for (const [k, v] of Object.entries(tokens.stroke)) lines.push(`$stroke-${k}: ${v};`)
  if (section === "shadows")
    for (const s of tokens.shadows) lines.push(`$shadow-${s.id}: ${s.value};`)
  if (section === "gradients" && tokens.gradients?.length)
    for (const g of tokens.gradients) lines.push(`$gradient-${g.id}: ${gradientToCss(g)};`)

  return lines.join("\n")
}

export function tokenStats(tokens: DesignTokens) {
  const colorCount = tokens.colors.palettes.reduce((n, p) => n + Object.keys(p.shades).length, 0) + tokens.colors.semantic.length
  return {
    colors:     colorCount,
    typography: Object.keys(tokens.typography.fontSizes).length + Object.keys(tokens.typography.fontWeights).length + Object.keys(tokens.typography.fontFamilies).length,
    spacing:    Object.keys(tokens.spacing).length,
    radius:     Object.keys(tokens.radius).length,
    stroke:     Object.keys(tokens.stroke).length,
    shadows:    tokens.shadows.length,
    gradients:  tokens.gradients?.length ?? 0,
    total() { return this.colors + this.typography + this.spacing + this.radius + this.stroke + this.shadows + this.gradients },
  }
}

// ─── Figma Tokens ─────────────────────────────────────────────────────────
/**
 * Legacy Figma Tokens plugin format (manual copy/paste).
 * @deprecated Prefer the two-way sync via `src/lib/figma/syncEngine.ts`
 *             (uses the Figma Variables REST API + DTCG canonical format).
 *             Kept for backward compatibility with the export modal.
 */
export function exportToFigmaTokens(tokens: DesignTokens): string {
  const result: FigmaTokensFormat = {}

  const colorNode: FigmaTokensFormat = {}
  for (const palette of tokens.colors.palettes) {
    colorNode[palette.name] = {}
    for (const [shade, value] of Object.entries(palette.shades)) {
      (colorNode[palette.name] as FigmaTokensFormat)[shade] = { value, type: "color" }
    }
  }
  const semanticLight: FigmaTokensFormat = {}
  const semanticDark:  FigmaTokensFormat = {}
  for (const c of tokens.colors.semantic) {
    const lv = c.lightRef ? (resolveRef(c.lightRef, tokens.colors.palettes) ?? c.lightValue) : c.lightValue
    const dv = c.darkRef  ? (resolveRef(c.darkRef,  tokens.colors.palettes) ?? c.darkValue)  : c.darkValue
    semanticLight[c.name] = { value: c.lightRef ? `{color.${c.lightRef.replace(".", ".")}}` : lv, type: "color" }
    semanticDark[c.name]  = { value: c.darkRef  ? `{color.${c.darkRef.replace(".", ".")}}` : dv, type: "color" }
  }
  result["color"] = { ...colorNode, "semantic/light": semanticLight, "semantic/dark": semanticDark }

  const fontSizeNode: FigmaTokensFormat = {}
  for (const [k, v] of Object.entries(tokens.typography.fontSizes)) fontSizeNode[k] = { value: v, type: "fontSizes" }
  const fontWeightNode: FigmaTokensFormat = {}
  for (const [k, v] of Object.entries(tokens.typography.fontWeights)) fontWeightNode[k] = { value: String(v), type: "fontWeights" }
  result["fontSize"] = fontSizeNode
  result["fontWeight"] = fontWeightNode

  const spacingNode: FigmaTokensFormat = {}
  for (const [k, v] of Object.entries(tokens.spacing)) spacingNode[k] = { value: v, type: "spacing" }
  result["spacing"] = spacingNode

  const radiusNode: FigmaTokensFormat = {}
  for (const [k, v] of Object.entries(tokens.radius)) radiusNode[k] = { value: v, type: "borderRadius" }
  result["borderRadius"] = radiusNode

  const strokeNode: FigmaTokensFormat = {}
  for (const [k, v] of Object.entries(tokens.stroke)) strokeNode[k === "0" ? "none" : k] = { value: v, type: "borderWidth" }
  result["borderWidth"] = strokeNode

  const shadowNode: FigmaTokensFormat = {}
  for (const s of tokens.shadows) shadowNode[s.name] = { value: s.value, type: "boxShadow" }
  result["boxShadow"] = shadowNode

  return JSON.stringify(result, null, 2)
}
