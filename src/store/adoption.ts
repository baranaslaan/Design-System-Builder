import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AdoptionFilters, TrackedRepo, TrackedFigmaFile } from "@/types/adoption"

interface AdoptionState {
  filters: AdoptionFilters
  repos: TrackedRepo[]
  figmaFiles: TrackedFigmaFile[]
  sourcesLoading: boolean
  setFilters: (p: Partial<AdoptionFilters>) => void
  resetFilters: () => void
  setRepos: (r: TrackedRepo[]) => void
  setFigmaFiles: (f: TrackedFigmaFile[]) => void
  setSourcesLoading: (b: boolean) => void
}

const DEFAULT_FILTERS: AdoptionFilters = { teams: [], components: [], from: null, to: null }

export const useAdoptionStore = create<AdoptionState>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      repos: [],
      figmaFiles: [],
      sourcesLoading: false,
      setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      setRepos: (repos) => set({ repos }),
      setFigmaFiles: (figmaFiles) => set({ figmaFiles }),
      setSourcesLoading: (sourcesLoading) => set({ sourcesLoading }),
    }),
    { name: "dsb-adoption", partialize: (s) => ({ filters: s.filters }) }
  )
)
