import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { OnboardingProgress, Role } from "@/types/onboarding"

interface OnboardingState {
  role: Role | null
  completed: Set<string>
  badges: Set<string>
  certificateIssuedAt: string | null
  tooltipsSeen: Set<string>
  hydrated: boolean
  setRole: (r: Role) => void
  markCompleted: (stepId: string, badge?: string) => void
  markCertificate: () => void
  hasSeenTooltip: (id: string) => boolean
  markTooltipSeen: (id: string) => void
  hydrate: (p: OnboardingProgress | null, seenIds: string[]) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      role: null,
      completed: new Set(),
      badges: new Set(),
      certificateIssuedAt: null,
      tooltipsSeen: new Set(),
      hydrated: false,
      setRole: (role) => set({ role }),
      markCompleted: (stepId, badge) => set((s) => {
        const completed = new Set(s.completed); completed.add(stepId)
        const badges = new Set(s.badges); if (badge) badges.add(badge)
        return { completed, badges }
      }),
      markCertificate: () => set({ certificateIssuedAt: new Date().toISOString() }),
      hasSeenTooltip: (id) => get().tooltipsSeen.has(id),
      markTooltipSeen: (id) => set((s) => {
        const tooltipsSeen = new Set(s.tooltipsSeen); tooltipsSeen.add(id)
        return { tooltipsSeen }
      }),
      hydrate: (p, seenIds) => set({
        role: p?.role ?? null,
        completed: new Set(p?.completed_steps ?? []),
        badges: new Set(p?.badges ?? []),
        certificateIssuedAt: p?.certificate_issued_at ?? null,
        tooltipsSeen: new Set(seenIds),
        hydrated: true,
      }),
    }),
    {
      name: "dsb-onboarding",
      // Don't persist Sets through JSON. We re-hydrate from server on bootstrap.
      partialize: (s) => ({ role: s.role }),
    }
  )
)
