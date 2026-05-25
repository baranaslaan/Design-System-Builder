export type IssueSeverity = "critical" | "warning" | "info"

export interface A11yIssue {
  id: string
  severity: IssueSeverity
  msg: string
  el?: string  // element descriptor (tagName + class)
  wcag?: string // e.g. "1.4.3"
}

export interface A11yBreakdown {
  contrast: number   // 0–100
  touch: number
  focus: number
  scaling: number
  issues: A11yIssue[]
}

export interface BrandBreakdown {
  colorCoverage: number   // 0–1
  fontCoverage: number
  spacingCoverage: number
  offTokens: Array<{ kind: "color" | "font" | "spacing"; raw: string }>
}

export interface ScoreBreakdown {
  a11y: A11yBreakdown
  brand: BrandBreakdown
}

export interface ComponentScore {
  component_id: string
  variant: string | null
  a11y_score: number
  brand_score: number
  breakdown: ScoreBreakdown
}

export interface ScoringRun {
  id: string
  taken_at: string
  trigger: "manual" | "auto-update"
  tokens_hash: string | null
  avg_a11y: number
  avg_brand: number
  component_n: number
}

export interface ScoreDiff {
  component_id: string
  a11y_before: number
  a11y_after: number
  a11y_delta: number
  brand_before: number
  brand_after: number
  brand_delta: number
  newIssues: A11yIssue[]
  resolvedIssues: A11yIssue[]
}
