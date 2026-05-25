// Conflict detection: compare two snapshots of the core layer and intersect
// the change set with each brand's override paths.

import { flatten } from "./paths"
import type { DesignTokens } from "@/types/tokens"
import type { MergeConflictEntry } from "@/types/brands"

export interface CoreChange { path: string; old: unknown; next: unknown }

export function diffCoreVersions(oldCore: DesignTokens, newCore: DesignTokens): CoreChange[] {
  const o = flatten(oldCore)
  const n = flatten(newCore)
  const keys = new Set([...Object.keys(o), ...Object.keys(n)])
  const out: CoreChange[] = []
  for (const k of keys) {
    if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) out.push({ path: k, old: o[k], next: n[k] })
  }
  return out
}

export function detectConflicts(
  coreChanges: CoreChange[],
  brandOverrides: Record<string, unknown>,        // brand layer
  semanticBrandOverrides: Record<string, unknown> = {},
): MergeConflictEntry[] {
  const out: MergeConflictEntry[] = []
  const allBrand = { ...semanticBrandOverrides, ...brandOverrides } // brand wins
  for (const ch of coreChanges) {
    if (ch.path in allBrand) {
      out.push({
        path: ch.path,
        brand_value: allBrand[ch.path],
        old_core: ch.old,
        new_core: ch.next,
        resolution: null,
      })
    }
  }
  return out
}
