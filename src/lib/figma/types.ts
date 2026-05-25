// Figma Variables API + DTCG (Design Tokens Community Group) types.
// Reference: https://www.figma.com/developers/api#variables
//            https://tr.designtokens.org/format/

// ─── DTCG ────────────────────────────────────────────────────────────────────

export type DTCGType =
  | "color" | "dimension" | "fontFamily" | "fontWeight" | "duration"
  | "cubicBezier" | "number" | "string" | "shadow" | "gradient"
  | "typography" | "border" | "transition" | "strokeStyle"

/** A DTCG token leaf — must contain $value and (recommended) $type. */
export interface DTCGToken {
  $value: unknown
  $type?: DTCGType
  $description?: string
  $extensions?: Record<string, unknown>
}

/** A DTCG group is any object that does NOT contain $value at its top level. */
export type DTCGGroup = { [name: string]: DTCGGroup | DTCGToken } & {
  $description?: string
  $type?: DTCGType
}

/** Root DTCG document. */
export type DTCGDocument = DTCGGroup

// ─── Figma Variables API ─────────────────────────────────────────────────────

export type FigmaVariableType = "BOOLEAN" | "FLOAT" | "STRING" | "COLOR"
export type FigmaVariableScope =
  | "ALL_SCOPES" | "TEXT_CONTENT" | "CORNER_RADIUS" | "WIDTH_HEIGHT"
  | "GAP" | "ALL_FILLS" | "FRAME_FILL" | "SHAPE_FILL" | "TEXT_FILL"
  | "STROKE_COLOR" | "STROKE_FLOAT" | "EFFECT_FLOAT" | "EFFECT_COLOR"
  | "OPACITY" | "FONT_FAMILY" | "FONT_STYLE" | "FONT_WEIGHT" | "FONT_SIZE"
  | "LINE_HEIGHT" | "LETTER_SPACING" | "PARAGRAPH_SPACING" | "PARAGRAPH_INDENT"

export interface FigmaRGBA { r: number; g: number; b: number; a: number }
export interface FigmaVariableAlias { type: "VARIABLE_ALIAS"; id: string }

export type FigmaVariableValue = string | number | boolean | FigmaRGBA | FigmaVariableAlias

export interface FigmaVariableCollection {
  id: string
  name: string
  key: string
  modes: { modeId: string; name: string }[]
  defaultModeId: string
  remote: boolean
  hiddenFromPublishing: boolean
  variableIds: string[]
}

export interface FigmaVariable {
  id: string
  name: string
  key: string
  variableCollectionId: string
  resolvedType: FigmaVariableType
  valuesByMode: Record<string, FigmaVariableValue>
  remote: boolean
  description: string
  hiddenFromPublishing: boolean
  scopes: FigmaVariableScope[]
  codeSyntax?: Record<string, string>
}

export interface FigmaVariablesResponse {
  status: number
  error: boolean
  meta: {
    variables: Record<string, FigmaVariable>
    variableCollections: Record<string, FigmaVariableCollection>
  }
}

// POST /v1/files/:key/variables payload

export type FigmaAction = "CREATE" | "UPDATE" | "DELETE"

export interface FigmaVariableCollectionChange {
  action: FigmaAction
  id?: string
  name?: string
  initialModeId?: string
  hiddenFromPublishing?: boolean
}

export interface FigmaVariableChange {
  action: FigmaAction
  id?: string
  name?: string
  variableCollectionId?: string
  resolvedType?: FigmaVariableType
  description?: string
  hiddenFromPublishing?: boolean
  scopes?: FigmaVariableScope[]
}

export interface FigmaVariableModeValue {
  variableId: string
  modeId: string
  value: FigmaVariableValue
}

export interface FigmaVariablesUpdatePayload {
  variableCollections?: FigmaVariableCollectionChange[]
  variableModes?: { action: FigmaAction; id?: string; name?: string; variableCollectionId?: string }[]
  variables?: FigmaVariableChange[]
  variableModeValues?: FigmaVariableModeValue[]
}

// ─── Sync engine ─────────────────────────────────────────────────────────────

/** A single token identified by a stable dot path, e.g. "colors.palettes.primary.500". */
export interface TokenLeaf {
  path: string
  type: DTCGType
  value: unknown
  description?: string
}

export type ConflictResolution = "local" | "remote" | "skip"

export interface TokenConflict {
  path: string
  type: DTCGType
  baseValue: unknown
  localValue: unknown
  remoteValue: unknown
  resolution?: ConflictResolution
}

export interface SyncDiff {
  onlyLocal: TokenLeaf[]    // changed only locally → push
  onlyRemote: TokenLeaf[]   // changed only remotely → pull
  conflicts: TokenConflict[]
  unchanged: number
}

export type SyncDirection = "pull" | "push" | "sync"

export interface SyncLogEntry {
  id: string
  fileKey: string
  direction: SyncDirection
  conflictsCount: number
  changes: {
    pushed: TokenLeaf[]
    pulled: TokenLeaf[]
    skipped: TokenLeaf[]
    unsupported: TokenLeaf[]
  }
  timestamp: number
  error?: string
}

export interface SyncResult {
  ok: boolean
  log: SyncLogEntry
  diff: SyncDiff
}
