// Brand score: walk the rendered DOM, collect every distinct color / font /
// spacing actually applied, and compute what % of them match a known token.

import type { DesignTokens } from "@/types/tokens"
import type { BrandBreakdown } from "@/types/scoring"

const SPACING_PROPS = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
                       "marginTop", "marginRight", "marginBottom", "marginLeft", "gap"] as const

function rgbToHex(rgb: string): string | null {
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) return null
  return "#" + [m[1], m[2], m[3]].map(n => parseInt(n, 10).toString(16).padStart(2, "0")).join("")
}

function collectColorTokens(tokens: DesignTokens): Set<string> {
  const s = new Set<string>()
  for (const pal of tokens.colors?.palettes ?? []) {
    for (const hex of Object.values(pal.shades)) s.add(hex.toLowerCase())
  }
  for (const sem of tokens.colors?.semantic ?? []) {
    s.add(sem.lightValue.toLowerCase()); s.add(sem.darkValue.toLowerCase())
  }
  return s
}
function collectFontTokens(tokens: DesignTokens): Set<string> {
  const s = new Set<string>()
  const ff = tokens.typography?.fontFamilies
  if (ff) [ff.sans, ff.serif, ff.mono].forEach(f => f && s.add(f.split(",")[0].trim().toLowerCase().replace(/['"]/g, "")))
  return s
}
function collectSpacingTokens(tokens: DesignTokens): Set<number> {
  const s = new Set<number>([0])
  for (const v of Object.values(tokens.spacing ?? {})) {
    const n = parseFloat(String(v))
    if (isFinite(n)) s.add(n)
  }
  return s
}

export function scoreBrand(root: HTMLElement, tokens: DesignTokens): BrandBreakdown {
  const colorTokens   = collectColorTokens(tokens)
  const fontTokens    = collectFontTokens(tokens)
  const spacingTokens = collectSpacingTokens(tokens)

  const offTokens: BrandBreakdown["offTokens"] = []
  let colorTotal = 0, colorPass = 0
  let fontTotal = 0,  fontPass = 0
  let spaceTotal = 0, spacePass = 0

  root.querySelectorAll<HTMLElement>("*").forEach(el => {
    const cs = getComputedStyle(el)
    if (cs.display === "none") return

    // Colors: text + background
    for (const prop of ["color", "backgroundColor", "borderTopColor"] as const) {
      const v = cs[prop]
      const hex = rgbToHex(v)
      if (!hex) continue
      // skip transparent (alpha ~0) — rgba returns rgba(0,0,0,0) commonly
      if (v.includes("rgba") && /,\s*0\s*\)/.test(v)) continue
      colorTotal++
      if (colorTokens.has(hex.toLowerCase())) colorPass++
      else offTokens.push({ kind: "color", raw: hex })
    }

    // Font family (first family in stack)
    const fam = cs.fontFamily?.split(",")[0]?.trim().toLowerCase().replace(/['"]/g, "")
    if (fam) {
      fontTotal++
      if (fontTokens.has(fam)) fontPass++
      else if (!offTokens.some(o => o.kind === "font" && o.raw === fam))
        offTokens.push({ kind: "font", raw: fam })
    }

    // Spacing (px values for padding/margin/gap)
    for (const prop of SPACING_PROPS) {
      const v = parseFloat(cs[prop])
      if (!isFinite(v) || v === 0) continue
      spaceTotal++
      if ([...spacingTokens].some(t => Math.abs(t - v) <= 0.5)) spacePass++
      else offTokens.push({ kind: "spacing", raw: `${v}px` })
    }
  })

  return {
    colorCoverage:   colorTotal ? colorPass / colorTotal : 1,
    fontCoverage:    fontTotal  ? fontPass / fontTotal   : 1,
    spacingCoverage: spaceTotal ? spacePass / spaceTotal : 1,
    offTokens: offTokens.slice(0, 30),
  }
}

export function brandOverall(b: BrandBreakdown): number {
  // 50% color, 25% font, 25% spacing
  return Math.round((b.colorCoverage * 0.5 + b.fontCoverage * 0.25 + b.spacingCoverage * 0.25) * 100)
}
