// Maps internal DesignTokens ⇄ flat TokenLeaf[] ⇄ DTCG document ⇄ Figma Variables payload.
//
// Strategy:
//   1. Flatten DesignTokens into TokenLeaf[] with stable dot-paths (the "wire format"
//      used by the sync engine + conflict resolver).
//   2. From TokenLeaf[] we can emit:
//        • a DTCG document  (canonical interchange format)
//        • a Figma POST /variables payload (CREATE/UPDATE per variable)
//      and vice-versa: parse a Figma /variables GET response → TokenLeaf[].

import type {
  DesignTokens, ColorPalette, SemanticColor, GradientToken,
} from "@/types/tokens"
import type {
  DTCGDocument, DTCGToken, DTCGType,
  FigmaRGBA, FigmaVariable, FigmaVariablesResponse,
  FigmaVariablesUpdatePayload, FigmaVariableType,
  TokenLeaf,
} from "./types"

// ─── Color helpers ───────────────────────────────────────────────────────────

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export function hexToRgba(hex: string): FigmaRGBA {
  let h = hex.replace("#", "").trim()
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  if (h.length === 6) h += "ff"
  const num = parseInt(h, 16)
  return {
    r: ((num >> 24) & 0xff) / 255,
    g: ((num >> 16) & 0xff) / 255,
    b: ((num >> 8) & 0xff) / 255,
    a: (num & 0xff) / 255,
  }
}

export function rgbaToHex({ r, g, b, a }: FigmaRGBA): string {
  const to = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0")
  const base = `#${to(r)}${to(g)}${to(b)}`
  return a < 1 ? `${base}${to(a)}` : base
}

function isHex(v: unknown): v is string {
  return typeof v === "string" && HEX_RE.test(v)
}

// ─── DesignTokens → TokenLeaf[] (flatten) ────────────────────────────────────

export function flattenTokens(tokens: DesignTokens): TokenLeaf[] {
  const out: TokenLeaf[] = []

  // colors.palettes.{paletteName}.{shade}
  for (const palette of tokens.colors.palettes) {
    for (const [shade, value] of Object.entries(palette.shades)) {
      out.push({
        path: `colors.palettes.${palette.name}.${shade}`,
        type: "color",
        value,
      })
    }
  }
  // colors.semantic.{name}.{light|dark}
  for (const sem of tokens.colors.semantic) {
    out.push({ path: `colors.semantic.${sem.name}.light`, type: "color", value: sem.lightValue, description: sem.description })
    out.push({ path: `colors.semantic.${sem.name}.dark`,  type: "color", value: sem.darkValue,  description: sem.description })
  }

  // typography
  for (const [k, v] of Object.entries(tokens.typography.fontSizes))   out.push({ path: `typography.fontSizes.${k}`,   type: "dimension",  value: v })
  for (const [k, v] of Object.entries(tokens.typography.fontWeights)) out.push({ path: `typography.fontWeights.${k}`, type: "fontWeight", value: v })
  for (const [k, v] of Object.entries(tokens.typography.lineHeights)) out.push({ path: `typography.lineHeights.${k}`, type: "dimension",  value: v })
  for (const [k, v] of Object.entries(tokens.typography.fontFamilies))out.push({ path: `typography.fontFamilies.${k}`,type: "fontFamily", value: v })

  // numeric scales
  for (const [k, v] of Object.entries(tokens.spacing))     out.push({ path: `spacing.${k}`,     type: "dimension", value: v })
  for (const [k, v] of Object.entries(tokens.radius))      out.push({ path: `radius.${k}`,      type: "dimension", value: v })
  for (const [k, v] of Object.entries(tokens.stroke))      out.push({ path: `stroke.${k}`,      type: "dimension", value: v })
  for (const [k, v] of Object.entries(tokens.opacity))     out.push({ path: `opacity.${k}`,     type: "number",    value: v })
  for (const [k, v] of Object.entries(tokens.breakpoints)) out.push({ path: `breakpoints.${k}`, type: "dimension", value: v })
  for (const [k, v] of Object.entries(tokens.zIndex))      out.push({ path: `zIndex.${k}`,      type: "number",    value: v })
  for (const [k, v] of Object.entries(tokens.blur))        out.push({ path: `blur.${k}`,        type: "dimension", value: v })

  // motion
  for (const [k, v] of Object.entries(tokens.motion.durations)) out.push({ path: `motion.durations.${k}`, type: "duration",    value: v })
  for (const [k, v] of Object.entries(tokens.motion.easings))   out.push({ path: `motion.easings.${k}`,   type: "cubicBezier", value: v })

  // shadows / gradients → DTCG composite types (Figma Variables doesn't natively support these;
  // they're preserved in DTCG for round-trip but flagged "unsupported" when pushing to Figma.)
  for (const s of tokens.shadows)   out.push({ path: `shadows.${s.name}`,   type: "shadow",   value: s.value })
  for (const g of tokens.gradients) out.push({ path: `gradients.${g.name}`, type: "gradient", value: g })

  return out
}

// ─── TokenLeaf[] → DesignTokens (unflatten) ──────────────────────────────────
// Used when pulling from Figma: take a merged set of leaves and rebuild the
// rich DesignTokens shape, preserving any fields not represented in the leaves.

export function applyLeaves(base: DesignTokens, leaves: TokenLeaf[]): DesignTokens {
  const next: DesignTokens = JSON.parse(JSON.stringify(base))

  for (const leaf of leaves) {
    const parts = leaf.path.split(".")
    const v = leaf.value

    if (parts[0] === "colors" && parts[1] === "palettes") {
      // colors.palettes.{name}.{shade}
      const [, , name, shade] = parts
      let palette: ColorPalette | undefined = next.colors.palettes.find((p) => p.name === name)
      if (!palette) {
        palette = { id: `p-${name}`, name, shades: {} as ColorPalette["shades"] }
        next.colors.palettes.push(palette)
      }
      ;(palette.shades as Record<string, string>)[shade] = String(v)
    } else if (parts[0] === "colors" && parts[1] === "semantic") {
      const [, , name, mode] = parts
      let sem: SemanticColor | undefined = next.colors.semantic.find((s) => s.name === name)
      if (!sem) {
        sem = { id: `s-${name}`, name, lightValue: "#000000", darkValue: "#ffffff" }
        next.colors.semantic.push(sem)
      }
      if (mode === "light") sem.lightValue = String(v)
      if (mode === "dark")  sem.darkValue  = String(v)
      if (leaf.description) sem.description = leaf.description
    } else if (parts[0] === "typography") {
      const [, sub, key] = parts
      if (sub === "fontWeights") (next.typography.fontWeights as Record<string, number>)[key] = Number(v)
      else if (sub === "fontFamilies") (next.typography.fontFamilies as Record<string, string>)[key] = String(v)
      else (next.typography[sub as "fontSizes" | "lineHeights"] as Record<string, string>)[key] = String(v)
    } else if (parts[0] === "motion") {
      const [, sub, key] = parts
      ;(next.motion[sub as "durations" | "easings"] as Record<string, string>)[key] = String(v)
    } else if (parts[0] === "shadows") {
      const name = parts[1]
      const existing = next.shadows.find((s) => s.name === name)
      if (existing) existing.value = String(v)
      else next.shadows.push({ id: `sh-${name}`, name, value: String(v) })
    } else if (parts[0] === "gradients") {
      // gradient round-trip needs the full object preserved in $value
      const name = parts[1]
      const g = v as GradientToken
      const idx = next.gradients.findIndex((x) => x.name === name)
      if (idx >= 0) next.gradients[idx] = { ...g, name }
      else next.gradients.push({ ...g, name })
    } else {
      // flat scales: spacing/radius/stroke/opacity/breakpoints/zIndex/blur
      const [scale, key] = parts
      const target = next[scale as keyof DesignTokens] as Record<string, string | number>
      if (target && typeof target === "object") target[key] = leaf.type === "number" ? Number(v) : String(v)
    }
  }
  return next
}

// ─── DTCG ↔ TokenLeaf[] ──────────────────────────────────────────────────────

export function toDTCG(tokens: DesignTokens): DTCGDocument {
  const doc: DTCGDocument = {}
  for (const leaf of flattenTokens(tokens)) {
    const parts = leaf.path.split(".")
    let cursor: DTCGDocument = doc
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]
      if (!(seg in cursor) || isToken(cursor[seg])) cursor[seg] = {}
      cursor = cursor[seg] as DTCGDocument
    }
    const leafName = parts[parts.length - 1]
    const node: DTCGToken = { $value: leaf.value, $type: leaf.type }
    if (leaf.description) node.$description = leaf.description
    cursor[leafName] = node
  }
  return doc
}

export function fromDTCG(doc: DTCGDocument): TokenLeaf[] {
  const out: TokenLeaf[] = []
  const walk = (node: DTCGDocument | DTCGToken, path: string[]) => {
    if (isToken(node)) {
      out.push({
        path: path.join("."),
        type: (node.$type ?? "string") as DTCGType,
        value: node.$value,
        description: node.$description,
      })
      return
    }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("$")) continue
      walk(v as DTCGDocument | DTCGToken, [...path, k])
    }
  }
  walk(doc, [])
  return out
}

function isToken(node: unknown): node is DTCGToken {
  return !!node && typeof node === "object" && "$value" in (node as Record<string, unknown>)
}

// ─── TokenLeaf[] ↔ Figma Variables ───────────────────────────────────────────

const COLLECTION_NAME = "Design System Builder"
const MODE_LIGHT = "Light"
const MODE_DARK  = "Dark"

function dtcgTypeToFigma(t: DTCGType): FigmaVariableType | null {
  switch (t) {
    case "color":                                        return "COLOR"
    case "number": case "dimension": case "duration":    return "FLOAT"
    case "fontWeight":                                   return "FLOAT"
    case "fontFamily": case "cubicBezier": case "string":return "STRING"
    default: return null  // shadow, gradient, typography → unsupported in Variables
  }
}

function leafValueToFigma(leaf: TokenLeaf): string | number | FigmaRGBA | null {
  const figmaType = dtcgTypeToFigma(leaf.type)
  if (!figmaType) return null
  if (figmaType === "COLOR")  return isHex(leaf.value) ? hexToRgba(leaf.value) : null
  if (figmaType === "FLOAT") {
    if (typeof leaf.value === "number") return leaf.value
    if (typeof leaf.value === "string") {
      const m = leaf.value.match(/^(-?\d+(?:\.\d+)?)/)
      return m ? parseFloat(m[1]) : null
    }
    return null
  }
  // STRING
  return String(leaf.value)
}

/** Parse a Figma /variables GET response into the flat leaf format we use everywhere else. */
export function figmaResponseToLeaves(res: FigmaVariablesResponse): TokenLeaf[] {
  const out: TokenLeaf[] = []
  const collections = Object.values(res.meta.variableCollections)
  const ourCollection = collections.find((c) => c.name === COLLECTION_NAME) ?? collections[0]
  if (!ourCollection) return out

  const modeNameById = new Map(ourCollection.modes.map((m) => [m.modeId, m.name]))
  const defaultModeName = modeNameById.get(ourCollection.defaultModeId) ?? "default"

  for (const variable of Object.values(res.meta.variables)) {
    if (variable.variableCollectionId !== ourCollection.id) continue
    const basePath = variable.name.replace(/\//g, ".")

    for (const [modeId, raw] of Object.entries(variable.valuesByMode)) {
      const modeName = modeNameById.get(modeId) ?? "default"
      const isMultiMode = ourCollection.modes.length > 1 && modeName !== defaultModeName

      // Skip aliases on import — they round-trip as raw values
      if (raw && typeof raw === "object" && "type" in raw) continue

      const type = figmaTypeToDTCG(variable.resolvedType)
      const value: unknown =
        variable.resolvedType === "COLOR" ? rgbaToHex(raw as FigmaRGBA) :
        variable.resolvedType === "FLOAT" ? raw :
        String(raw)

      // semantic colors use .light / .dark suffix per mode
      const suffix = basePath.startsWith("colors.semantic.")
        ? `.${modeName.toLowerCase()}`
        : (isMultiMode ? `.${modeName.toLowerCase()}` : "")

      out.push({
        path: basePath + suffix,
        type,
        value,
        description: variable.description || undefined,
      })
    }
  }
  return out
}

function figmaTypeToDTCG(t: FigmaVariableType): DTCGType {
  switch (t) {
    case "COLOR":   return "color"
    case "FLOAT":   return "number"
    case "STRING":  return "string"
    case "BOOLEAN": return "string"
  }
}

/**
 * Build a POST /variables payload that creates/updates the given leaves in Figma.
 *
 * Strategy: we maintain a single collection named COLLECTION_NAME with two modes
 * (Light/Dark) so semantic colors map cleanly. All other tokens live in the
 * default (Light) mode. The caller passes `existing` (the current Figma state)
 * so we can pick UPDATE vs CREATE per variable by name match.
 *
 * Returns { payload, unsupported } — unsupported leaves are returned so the
 * sync engine can log them.
 */
export function buildFigmaUpdatePayload(
  leaves: TokenLeaf[],
  existing: FigmaVariablesResponse | null,
): { payload: FigmaVariablesUpdatePayload; unsupported: TokenLeaf[] } {
  const unsupported: TokenLeaf[] = []
  const payload: FigmaVariablesUpdatePayload = {
    variableCollections: [],
    variableModes: [],
    variables: [],
    variableModeValues: [],
  }

  // Locate or create our collection + modes (using temp ids the API accepts).
  let collectionId = "tmp_collection"
  let lightModeId  = "tmp_mode_light"
  let darkModeId   = "tmp_mode_dark"

  const existingCollection = existing
    ? Object.values(existing.meta.variableCollections).find((c) => c.name === COLLECTION_NAME)
    : undefined

  if (existingCollection) {
    collectionId = existingCollection.id
    lightModeId = existingCollection.modes.find((m) => m.name === MODE_LIGHT)?.modeId ?? existingCollection.defaultModeId
    darkModeId  = existingCollection.modes.find((m) => m.name === MODE_DARK)?.modeId  ?? lightModeId
  } else {
    payload.variableCollections!.push({
      action: "CREATE", id: collectionId, name: COLLECTION_NAME, initialModeId: lightModeId,
    })
    payload.variableModes!.push(
      { action: "UPDATE", id: lightModeId, name: MODE_LIGHT, variableCollectionId: collectionId },
      { action: "CREATE", id: darkModeId,  name: MODE_DARK,  variableCollectionId: collectionId },
    )
  }

  // Index existing variables by name (Figma uses "/" as separator).
  const existingVarByName = new Map<string, FigmaVariable>()
  if (existing) {
    for (const v of Object.values(existing.meta.variables)) {
      if (v.variableCollectionId === collectionId) existingVarByName.set(v.name, v)
    }
  }

  // We collapse semantic light/dark into one variable with both mode values.
  type Pending = { name: string; type: FigmaVariableType; description?: string; light?: unknown; dark?: unknown; either?: unknown }
  const pending = new Map<string, Pending>()

  for (const leaf of leaves) {
    const ftype = dtcgTypeToFigma(leaf.type)
    if (!ftype) { unsupported.push(leaf); continue }
    const fvalue = leafValueToFigma(leaf)
    if (fvalue === null) { unsupported.push(leaf); continue }

    let name = leaf.path.replace(/\./g, "/")
    let mode: "light" | "dark" | "either" = "either"
    if (leaf.path.startsWith("colors.semantic.")) {
      if (leaf.path.endsWith(".light")) { mode = "light"; name = name.slice(0, -"/light".length) }
      if (leaf.path.endsWith(".dark"))  { mode = "dark";  name = name.slice(0, -"/dark".length) }
    }

    const p = pending.get(name) ?? { name, type: ftype, description: leaf.description }
    if (mode === "light") p.light = fvalue
    else if (mode === "dark") p.dark = fvalue
    else p.either = fvalue
    pending.set(name, p)
  }

  for (const p of pending.values()) {
    const existingVar = existingVarByName.get(p.name)
    const variableId = existingVar?.id ?? `tmp_${p.name.replace(/[^a-zA-Z0-9]/g, "_")}`

    if (!existingVar) {
      payload.variables!.push({
        action: "CREATE",
        id: variableId,
        name: p.name,
        variableCollectionId: collectionId,
        resolvedType: p.type,
        description: p.description,
      })
    } else if (p.description && p.description !== existingVar.description) {
      payload.variables!.push({ action: "UPDATE", id: variableId, description: p.description })
    }

    if (p.either !== undefined) {
      payload.variableModeValues!.push({ variableId, modeId: lightModeId, value: p.either as never })
    }
    if (p.light !== undefined) {
      payload.variableModeValues!.push({ variableId, modeId: lightModeId, value: p.light as never })
    }
    if (p.dark !== undefined) {
      payload.variableModeValues!.push({ variableId, modeId: darkModeId,  value: p.dark  as never })
    }
  }

  // Trim empty arrays
  if (!payload.variableCollections!.length) delete payload.variableCollections
  if (!payload.variableModes!.length)       delete payload.variableModes
  if (!payload.variables!.length)           delete payload.variables
  if (!payload.variableModeValues!.length)  delete payload.variableModeValues

  return { payload, unsupported }
}
