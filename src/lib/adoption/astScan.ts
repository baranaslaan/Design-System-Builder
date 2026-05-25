// Lightweight regex-based scanner. No heavy AST deps — we read JSX/TSX/CSS
// for two things: (1) component usage by tag name, (2) hardcoded values
// (rogue) that should be tokens.

import type { RogueKind } from "@/types/adoption"

export interface UsageHit { component: string; line: number }
export interface RogueHit { kind: RogueKind; raw: string; line: number; snippet: string }

// Cap per-line length to defuse soft-DoS via 200KB single-line minified
// files. Practical source lines fit well under this.
const MAX_LINE_CHARS = 2000

// Pattern sources — we build fresh RegExp instances per call to avoid
// `lastIndex` races between concurrent requests on the same server.
const JSX_TAG_SRC      = /<([A-Z][A-Za-z0-9]*)\b/.source
const HEX_SRC          = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/.source
const RGB_SRC          = /\brgba?\([^)]+\)/.source
const HSL_SRC          = /\bhsla?\([^)]+\)/.source
const PX_SRC           = /\b(\d+(?:\.\d+)?)px\b/.source
const SHADOW_LINE_SRC  = /box-shadow\s*:\s*([^;]+);/.source
const FONT_SIZE_SRC    = /font-size\s*:\s*([^;]+);/.source
const RADIUS_LINE_SRC  = /border-radius\s*:\s*([^;]+);/.source

const mk = (src: string) => new RegExp(src, "g")
const isTokenized = (s: string) => /var\(--/.test(s)

export function scanForUsage(source: string, knownComponents?: Set<string>): UsageHit[] {
  const hits: UsageHit[] = []
  const jsxTag = mk(JSX_TAG_SRC)
  source.split("\n").forEach((ln, i) => {
    if (ln.length > MAX_LINE_CHARS) ln = ln.slice(0, MAX_LINE_CHARS)
    jsxTag.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = jsxTag.exec(ln))) {
      const name = m[1]
      if (knownComponents && !knownComponents.has(name)) continue
      hits.push({ component: name, line: i + 1 })
    }
  })
  return hits
}

export function scanForRogue(source: string, ext: string): RogueHit[] {
  const hits: RogueHit[] = []
  const isStyle = /\.(css|scss|sass|less)$/i.test(ext)
  const hex = mk(HEX_SRC), rgb = mk(RGB_SRC), hsl = mk(HSL_SRC), px = mk(PX_SRC)
  const shadow = mk(SHADOW_LINE_SRC), fontSize = mk(FONT_SIZE_SRC), radius = mk(RADIUS_LINE_SRC)

  source.split("\n").forEach((raw, i) => {
    if (raw.length > MAX_LINE_CHARS) raw = raw.slice(0, MAX_LINE_CHARS)
    const line = i + 1
    const snippet = raw.trim().slice(0, 200)

    let m: RegExpExecArray | null
    hex.lastIndex = 0
    while ((m = hex.exec(raw))) {
      if (isTokenized(raw)) break
      hits.push({ kind: "color", raw: m[0], line, snippet })
    }
    rgb.lastIndex = 0
    while ((m = rgb.exec(raw))) if (!isTokenized(raw)) hits.push({ kind: "color", raw: m[0], line, snippet })
    hsl.lastIndex = 0
    while ((m = hsl.exec(raw))) if (!isTokenized(raw)) hits.push({ kind: "color", raw: m[0], line, snippet })

    if (isStyle) {
      shadow.lastIndex = 0
      while ((m = shadow.exec(raw))) if (!isTokenized(m[1])) hits.push({ kind: "shadow", raw: m[1].trim(), line, snippet })
      fontSize.lastIndex = 0
      while ((m = fontSize.exec(raw))) if (!isTokenized(m[1])) hits.push({ kind: "font-size", raw: m[1].trim(), line, snippet })
      radius.lastIndex = 0
      while ((m = radius.exec(raw))) if (!isTokenized(m[1])) hits.push({ kind: "radius", raw: m[1].trim(), line, snippet })

      if (!isTokenized(raw)) {
        px.lastIndex = 0
        while ((m = px.exec(raw))) {
          const v = parseFloat(m[1])
          if (v === 0 || v === 1) continue
          hits.push({ kind: "spacing", raw: m[0], line, snippet })
        }
      }
    }
  })

  return hits
}
