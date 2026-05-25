import { create } from "zustand"
import type { Brand, TokenLayer, MergeConflict, ResolvedTokens, BrandPermissions } from "@/types/brands"

interface BrandsState {
  brands: Brand[]
  activeBrandId: string | null
  layers: TokenLayer[]
  resolved: ResolvedTokens | null
  permissions: BrandPermissions
  conflicts: MergeConflict[]
  selectedPath: string | null
  setBrands: (b: Brand[]) => void
  setActiveBrandId: (id: string | null) => void
  setLayers: (l: TokenLayer[]) => void
  setResolved: (r: ResolvedTokens | null) => void
  setPermissions: (p: BrandPermissions) => void
  setConflicts: (c: MergeConflict[]) => void
  setSelectedPath: (p: string | null) => void
}

const DEFAULT_PERMS: BrandPermissions = {
  canEditCore: false, canEditSemanticGlobal: false,
  canEditSemanticBrand: false, canEditBrand: false, canResolveConflicts: false,
}

export const useBrandsStore = create<BrandsState>((set) => ({
  brands: [], activeBrandId: null, layers: [], resolved: null,
  permissions: DEFAULT_PERMS, conflicts: [], selectedPath: null,
  setBrands: (brands) => set({ brands }),
  setActiveBrandId: (activeBrandId) => set({ activeBrandId }),
  setLayers: (layers) => set({ layers }),
  setResolved: (resolved) => set({ resolved }),
  setPermissions: (permissions) => set({ permissions }),
  setConflicts: (conflicts) => set({ conflicts }),
  setSelectedPath: (selectedPath) => set({ selectedPath }),
}))
