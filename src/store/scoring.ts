import { create } from "zustand"
import type { ComponentScore, ScoringRun, ScoreDiff } from "@/types/scoring"

interface ScoringState {
  currentRun: ScoringRun | null
  previousRun: ScoringRun | null
  scores: ComponentScore[]
  previousScores: ComponentScore[]
  diff: ScoreDiff[]
  runs: ScoringRun[]
  running: boolean
  setRunning: (b: boolean) => void
  setCurrent: (run: ScoringRun | null, scores: ComponentScore[]) => void
  setPrevious: (run: ScoringRun | null, scores: ComponentScore[]) => void
  setDiff: (d: ScoreDiff[]) => void
  setRuns: (r: ScoringRun[]) => void
}

export const useScoringStore = create<ScoringState>((set) => ({
  currentRun: null, previousRun: null,
  scores: [], previousScores: [],
  diff: [], runs: [], running: false,
  setRunning: (running) => set({ running }),
  setCurrent: (currentRun, scores) => set({ currentRun, scores }),
  setPrevious: (previousRun, previousScores) => set({ previousRun, previousScores }),
  setDiff: (diff) => set({ diff }),
  setRuns: (runs) => set({ runs }),
}))
