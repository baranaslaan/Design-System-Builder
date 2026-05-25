// Walk a Figma file tree and flag fills/strokes/text styles that don't
// reference a published variable/style — i.e. deviations from the DS.

const FIGMA = "https://api.figma.com/v1"

const SAFE_KEY   = /^[A-Za-z0-9]{6,64}$/
const SAFE_TOKEN = /^[A-Za-z0-9_-]+$/
const MAX_DEPTH  = 1000

export interface FigmaDeviation {
  kind: "figma-fill" | "figma-stroke" | "figma-text"
  location: string         // "Page > Frame > Component / Variant"
  raw_value: string        // hex color or "16/24 Inter 400"
}

interface FigmaPaint { type?: string; color?: { r: number; g: number; b: number; a?: number } }
interface FigmaTypeStyle { fontFamily?: string; fontWeight?: number; fontSize?: number; lineHeightPx?: number }
interface Node {
  id?: string
  name?: string
  type?: string
  fills?: FigmaPaint[]
  strokes?: FigmaPaint[]
  style?: FigmaTypeStyle
  styles?: Record<string, string>          // present when bound to a published style
  boundVariables?: Record<string, unknown> // present when bound to a variable
  children?: Node[]
}

const rgbToHex = (c?: { r: number; g: number; b: number }) =>
  !c ? "" : "#" + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("")

export async function scanFigmaDeviations(fileKey: string, token: string): Promise<FigmaDeviation[]> {
  if (!SAFE_KEY.test(fileKey)) throw new Error(`Invalid file key`)
  if (!SAFE_TOKEN.test(token)) throw new Error(`Invalid Figma token format`)

  const res = await fetch(`${FIGMA}/files/${fileKey}`, { headers: { "X-Figma-Token": token } })
  if (!res.ok) throw new Error(`Figma ${res.status}`)
  const file = await res.json()

  const out: FigmaDeviation[] = []
  const path: string[] = []

  const walk = (n: Node, depth = 0) => {
    if (!n || depth > MAX_DEPTH) return
    if (n.name) path.push(n.name)
    const loc = path.join(" > ")

    const styleBound = (key: string) => !!(n.styles && n.styles[key])
    const varBound   = (key: string) => !!(n.boundVariables && n.boundVariables[key])

    // Fills — only flag SOLID paints not bound to a style/variable
    if (Array.isArray(n.fills) && !styleBound("fill") && !varBound("fills")) {
      for (const p of n.fills) {
        if (p?.type === "SOLID" && p.color) {
          out.push({ kind: "figma-fill", location: loc, raw_value: rgbToHex(p.color) })
        }
      }
    }
    // Strokes
    if (Array.isArray(n.strokes) && !styleBound("stroke") && !varBound("strokes")) {
      for (const p of n.strokes) {
        if (p?.type === "SOLID" && p.color) {
          out.push({ kind: "figma-stroke", location: loc, raw_value: rgbToHex(p.color) })
        }
      }
    }
    // Text style
    if (n.type === "TEXT" && n.style && !styleBound("text")) {
      const s = n.style
      out.push({
        kind: "figma-text",
        location: loc,
        raw_value: `${s.fontSize ?? "?"}/${s.lineHeightPx ?? "?"} ${s.fontFamily ?? "?"} ${s.fontWeight ?? ""}`.trim(),
      })
    }

    n.children?.forEach(c => walk(c, depth + 1))
    if (n.name) path.pop()
  }
  walk(file?.document)
  return out
}
