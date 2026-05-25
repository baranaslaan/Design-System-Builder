export type Role = "designer" | "developer" | "manager"

export interface OnboardingStep {
  id: string
  title: string
  description: string
  route: string            // navigate target
  ctaSelector?: string     // optional CSS selector to spotlight
  badge?: string           // badge id awarded on completion
}

export interface OnboardingProgress {
  user_id: string
  role: Role | null
  completed_steps: string[]
  badges: string[]
  certificate_issued_at: string | null
  updated_at: string
}
