import type { DesignTokens } from "./tokens"

export type LayerKind = "core" | "semantic_global" | "semantic_brand" | "brand"
export type Role = "admin" | "editor" | "viewer"

export interface Brand {
  id: string
  owner_id: string
  name: string
  slug: string
  parent_brand_id: string | null
  created_at: string
}

export interface BrandMember {
  brand_id: string
  user_id: string
  role: Role
}

export interface TokenLayer {
  id: string
  brand_id: string | null
  kind: LayerKind
  payload: Record<string, unknown> // sparse path-map (or full DesignTokens for core)
  version: number
  locked: boolean
  updated_at: string
}

export interface MergeConflictEntry {
  path: string
  brand_value: unknown
  old_core: unknown
  new_core: unknown
  resolution: "keep_brand" | "accept_core" | null
}
export interface MergeConflict {
  id: string
  brand_id: string
  core_version_from: number
  core_version_to: number
  status: "open" | "resolved"
  conflicts: MergeConflictEntry[]
  created_at: string
  resolved_at: string | null
}

// Resolution output — final tokens + per-path source attribution.
export interface ResolvedTokens {
  tokens: DesignTokens
  provenance: Record<string, LayerKind> // "path.to.key" → which layer last wrote it
}

// What a user can do on the current page, given their role for this brand.
export interface BrandPermissions {
  canEditCore: boolean            // only owner
  canEditSemanticGlobal: boolean  // only owner
  canEditSemanticBrand: boolean   // owner + admin
  canEditBrand: boolean           // owner + admin + editor
  canResolveConflicts: boolean
}
