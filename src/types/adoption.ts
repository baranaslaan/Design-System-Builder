export type SourceKind = "github" | "figma"
export type RogueKind = "color" | "spacing" | "radius" | "shadow" | "font-size"
export type ScanStatus = "idle" | "running" | "success" | "error"

export interface TrackedRepo {
  id: string
  owner: string
  repo: string
  default_branch: string
  team: string | null
  status: ScanStatus
  last_scanned_at: string | null
  error: string | null
}

export interface TrackedFigmaFile {
  id: string
  file_key: string
  file_name: string | null
  team: string | null
  status: ScanStatus
  last_scanned_at: string | null
}

export interface ComponentRegistryEntry {
  id: string
  component_name: string
  source: "design-system" | "figma"
  category: string | null
}

export interface ScanRun {
  id: string
  kind: SourceKind
  target_id: string
  status: ScanStatus
  started_at: string
  finished_at: string | null
  files_scanned: number
  components_seen: number
  rogue_count: number
  error: string | null
}

export interface ComponentUsageRow {
  id: string
  scan_id: string
  source_kind: SourceKind
  source_id: string
  team: string | null
  component_name: string
  file_path: string | null
  occurrences: number
  scanned_at: string
}

export interface RogueUsageRow {
  id: string
  scan_id: string
  source_kind: SourceKind
  source_id: string
  team: string | null
  file_path: string
  line: number | null
  snippet: string | null
  kind: RogueKind
  raw_value: string
  suggested_token: string | null
  scanned_at: string
}

export interface AdoptionSnapshot {
  id: string
  taken_at: string // date (YYYY-MM-DD)
  component_name: string | null
  team: string | null
  used_count: number
  available_count: number
  rate: number
  rogue_count: number
}

export interface AdoptionFilters {
  teams: string[]      // empty = all
  components: string[] // empty = all
  from: string | null  // ISO date
  to: string | null    // ISO date
}

export interface ComponentAdoptionRow {
  component_name: string
  repos_count: number
  files_count: number
  occurrences: number
  available: number
  rate: number          // 0..1
  trend: number[]       // last N daily rates (0..1)
}
