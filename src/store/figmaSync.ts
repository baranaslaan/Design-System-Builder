// figmaSync — connection status, per-file baselines (last-synced snapshots),
// and an in-memory sync log. Persisted to localStorage for offline use; cloud
// mirror to Supabase happens when the user is signed in.

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SyncLogEntry, TokenLeaf } from "@/lib/figma/types"

interface FileBaseline {
  fileKey: string
  fileName?: string
  lastSyncedAt: number
  baselineLeaves: TokenLeaf[]
}

interface FigmaSyncState {
  connected: boolean | null            // null = unknown / not yet checked
  setConnected: (v: boolean) => void

  baselines: Record<string, FileBaseline>     // keyed by fileKey
  setBaseline: (fileKey: string, leaves: TokenLeaf[], fileName?: string) => void
  getBaseline: (fileKey: string) => TokenLeaf[]

  activeFileKey: string | null
  setActiveFileKey: (k: string | null) => void

  log: SyncLogEntry[]                  // newest first, capped
  pushLog: (entry: SyncLogEntry) => void
  clearLog: () => void
}

const MAX_LOG = 50

export const useFigmaSyncStore = create<FigmaSyncState>()(
  persist(
    (set, get) => ({
      connected: null,
      setConnected: (v) => set({ connected: v }),

      baselines: {},
      setBaseline: (fileKey, leaves, fileName) =>
        set((s) => ({
          baselines: {
            ...s.baselines,
            [fileKey]: { fileKey, fileName, lastSyncedAt: Date.now(), baselineLeaves: leaves },
          },
        })),
      getBaseline: (fileKey) => get().baselines[fileKey]?.baselineLeaves ?? [],

      activeFileKey: null,
      setActiveFileKey: (k) => set({ activeFileKey: k }),

      log: [],
      pushLog: (entry) => set((s) => ({ log: [entry, ...s.log].slice(0, MAX_LOG) })),
      clearLog: () => set({ log: [] }),
    }),
    {
      name: "dsb-figma-sync",
      partialize: (s) => ({
        baselines: s.baselines,
        activeFileKey: s.activeFileKey,
        log: s.log,
      }),
    },
  ),
)
