// Map a rogue raw value to the nearest existing token in the design system.
import type { DesignTokens } from "@/types/tokens"
import type { RogueKind } from "@/types/adoption"

function hexToRgb(h: string): [number, number, number] | null {
  let s = h.replace("#", "")
  if (s.length === 3) s = s.split("").map((c) => c + c).join("")
  if (s.length !== 6 && s.length !== 8) return null
  const n = parseInt(s.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function colorDist(a: string, b: string): number {
  const ra = hexToRgb(a), rb = hexToRgb(b)
  if (!ra || !rb) return Infinity
  return Math.hypot(ra[0] - rb[0], ra[1] - rb[1], ra[2] - rb[2])
}

function collectColorTokens(tokens: DesignTokens) {
  const out: Array<{ name: string; value: string }> = []
  for (const pal of tokens.colors?.palettes ?? []) {
    for (const [shade, hex] of Object.entries(pal.shades)) {
      out.push({ name: `--color-${pal.name}-${shade}`, value: hex })
    }
  }
  for (const s of tokens.colors?.semantic ?? []) {
    out.push({ name: `--color-${s.name}`, value: s.lightValue })
  }
  return out
}

function collectScale(rec: Record<string, string> | undefined, prefix: string) {
  if (!rec) return []
  return Object.entries(rec).map(([k, v]) => ({ name: `--${prefix}-${k}`, value: String(v) }))
}

export function suggestToken(kind: RogueKind, raw: string, tokens: DesignTokens): string | null {
  if (!tokens) return null
  if (kind === "color") {
    if (!raw.startsWith("#")) return null
    const cands = collectColorTokens(tokens)
    let best: { name: string; d: number } | null = null
    for (const c of cands) {
      const d = colorDist(raw, c.value)
      if (!best || d < best.d) best = { name: c.name, d }
    }
    return best && best.d < 24 ? best.name : null
  }
  if (kind === "spacing" || kind === "radius" || kind === "font-size") {
    const px = parseFloat(raw)
    if (!isFinite(px)) return null
    const rec =
      kind === "spacing" ? tokens.spacing :
      kind === "radius"  ? tokens.radius  :
      tokens.typography?.fontSizes
    const cands = collectScale(rec, kind === "font-size" ? "text" : kind)
    let best: { name: string; d: number } | null = null
    for (const c of cands) {
      const v = parseFloat(c.value)
      if (!isFinite(v)) continue
      const d = Math.abs(px - v)
      if (!best || d < best.d) best = { name: c.name, d }
    }
    return best && best.d <= 2 ? best.name : null
  }
  return null
}
