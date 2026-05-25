export type Severity = "critical" | "warning" | "info"
export type FindingKind =
  | "color" | "spacing" | "radius" | "shadow" | "font-size"
  | "figma-fill" | "figma-text" | "figma-stroke"

export interface AuditFinding {
  id: string
  run_id: string
  source_kind: "github" | "figma"
  source_label: string | null
  severity: Severity
  kind: FindingKind
  location: string
  raw_value: string
  suggested_token: string | null
  confidence: number | null
  ai_reason: string | null
  created_at: string
}

export interface AuditSummary {
  critical: number
  warning: number
  info: number
  total: number
  by_kind: Record<string, number>
}

export interface AuditRun {
  id: string
  trigger: "manual" | "ci" | "scheduled"
  status: "running" | "success" | "error"
  started_at: string
  finished_at: string | null
  use_ai: boolean
  ai_model: string | null
  summary: AuditSummary
  error: string | null
}
