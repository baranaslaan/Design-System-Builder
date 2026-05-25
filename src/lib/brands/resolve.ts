// Layered resolution: core → semantic_global → semantic_brand → brand.
// Each non-core layer is a sparse path-map; we deep-set each entry onto
// the working copy and record which layer wrote it (for provenance).

import type { DesignTokens } from "@/types/tokens"
import type { LayerKind, TokenLayer, ResolvedTokens } from "@/types/brands"
import { setAt } from "./paths"

const LAYER_ORDER: LayerKind[] = ["core", "semantic_global", "semantic_brand", "brand"]

export function resolveLayers(layers: TokenLayer[]): ResolvedTokens {
  const byKind = Object.fromEntries(layers.map(l => [l.kind, l])) as Partial<Record<LayerKind, TokenLayer>>
  const core = byKind.core
  if (!core) throw new Error("missing core layer")
  const tokens: DesignTokens = JSON.parse(JSON.stringify(core.payload))
  const provenance: Record<string, LayerKind> = {}

  // Walk core leaves to seed provenance (we attribute every initial value to core).
  // We do this lazily — only when overridden, a new entry replaces.
  for (const kind of LAYER_ORDER.slice(1)) {
    const layer = byKind[kind]
    if (!layer) continue
    const map = layer.payload as Record<string, unknown>
    for (const [path, value] of Object.entries(map)) {
      setAt(tokens as unknown as Record<string, unknown>, path, value)
      provenance[path] = kind
    }
  }

  return { tokens, provenance }
}

// Source priority for "which layer should I edit this at, given my role?"
// Returns the highest layer the user is allowed to write that path on.
export function pickEditableLayer(
  path: string,
  perms: { canEditCore: boolean; canEditSemanticGlobal: boolean; canEditSemanticBrand: boolean; canEditBrand: boolean }
): LayerKind | null {
  if (perms.canEditBrand) return "brand"
  if (perms.canEditSemanticBrand && path.startsWith("colors.semantic")) return "semantic_brand"
  if (perms.canEditSemanticGlobal && path.startsWith("colors.semantic")) return "semantic_global"
  if (perms.canEditCore) return "core"
  return null
}
