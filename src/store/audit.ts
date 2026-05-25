import { create } from "zustand"
import type { AuditRun, AuditFinding, Severity } from "@/types/audit"

interface AuditState {
  currentRun: AuditRun | null
  findings: AuditFinding[]
  runs: AuditRun[]
  activeSeverity: Severity | "all"
  running: boolean
  setCurrentRun: (r: AuditRun | null) => void
  setFindings: (f: AuditFinding[]) => void
  setRuns: (r: AuditRun[]) => void
  setActiveSeverity: (s: Severity | "all") => void
  setRunning: (b: boolean) => void
}

export const useAuditStore = create<AuditState>((set) => ({
  currentRun: null,
  findings: [],
  runs: [],
  activeSeverity: "all",
  running: false,
  setCurrentRun: (currentRun) => set({ currentRun }),
  setFindings: (findings) => set({ findings }),
  setRuns: (runs) => set({ runs }),
  setActiveSeverity: (activeSeverity) => set({ activeSeverity }),
  setRunning: (running) => set({ running }),
}))
