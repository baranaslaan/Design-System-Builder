// Two-way sync orchestrator.
//
// pull()   — Figma → store
// push()   — store → Figma
// sync()   — bidirectional with conflict resolution callback
//
// Each operation returns a SyncResult with a sync-log entry (timestamp + diff).
// Callers are responsible for persisting the log (we hand it off to the figmaSync store).

import type { DesignTokens } from "@/types/tokens"
import { applyLeaves, buildFigmaUpdatePayload, figmaResponseToLeaves, flattenTokens } from "./mapper"
import { applyResolutions, computeDiff } from "./conflict"
import { getLocalVariables, postVariables } from "./client"
import type { SyncDiff, SyncLogEntry, SyncResult, TokenConflict, TokenLeaf } from "./types"

const newId = () => `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export type ConflictResolver = (conflicts: TokenConflict[]) => Promise<TokenConflict[]>

interface SyncArgs {
  fileKey: string
  localTokens: DesignTokens
  /** last-synced snapshot — empty leaves for first run */
  baseLeaves: TokenLeaf[]
  /** Called when conflicts exist. Returns conflicts with `resolution` filled in. */
  resolve?: ConflictResolver
  /** Receives the merged DesignTokens to write back into the local store. */
  applyToStore: (next: DesignTokens) => void
  /** Persists the new last-synced snapshot. */
  saveBaseline: (leaves: TokenLeaf[]) => Promise<void> | void
}

/** Pull-only: remote → local. Remote always wins. */
export async function pull(args: Omit<SyncArgs, "resolve">): Promise<SyncResult> {
  const log: SyncLogEntry = baseLog(args.fileKey, "pull")
  try {
    const response = await getLocalVariables(args.fileKey)
    const remoteLeaves = figmaResponseToLeaves(response)
    const next = applyLeaves(args.localTokens, remoteLeaves)
    args.applyToStore(next)
    await args.saveBaseline(remoteLeaves)
    log.changes.pulled = remoteLeaves
    return { ok: true, log, diff: emptyDiff(remoteLeaves.length) }
  } catch (e) {
    log.error = e instanceof Error ? e.message : "unknown"
    return { ok: false, log, diff: emptyDiff(0) }
  }
}

/** Push-only: local → remote. Local always wins. */
export async function push(args: Omit<SyncArgs, "resolve" | "applyToStore"> & { applyToStore?: (next: DesignTokens) => void }): Promise<SyncResult> {
  const log: SyncLogEntry = baseLog(args.fileKey, "push")
  try {
    const localLeaves = flattenTokens(args.localTokens)
    const existing = await safeGet(args.fileKey)
    const { payload, unsupported } = buildFigmaUpdatePayload(localLeaves, existing)
    await postVariables(args.fileKey, payload)
    await args.saveBaseline(localLeaves)
    log.changes.pushed = localLeaves
    log.changes.unsupported = unsupported
    return { ok: true, log, diff: emptyDiff(localLeaves.length) }
  } catch (e) {
    log.error = e instanceof Error ? e.message : "unknown"
    return { ok: false, log, diff: emptyDiff(0) }
  }
}

/** Full bidirectional sync with conflict resolution. */
export async function sync(args: SyncArgs): Promise<SyncResult> {
  const log: SyncLogEntry = baseLog(args.fileKey, "sync")
  try {
    const localLeaves = flattenTokens(args.localTokens)
    const existing = await safeGet(args.fileKey)
    const remoteLeaves = existing ? figmaResponseToLeaves(existing) : []

    const diff = computeDiff(args.baseLeaves, localLeaves, remoteLeaves)

    if (diff.conflicts.length > 0) {
      if (!args.resolve) {
        log.error = "conflicts_require_resolver"
        log.conflictsCount = diff.conflicts.length
        return { ok: false, log, diff }
      }
      diff.conflicts = await args.resolve(diff.conflicts)
    }
    log.conflictsCount = diff.conflicts.length

    const { toPush, toPull, skipped } = applyResolutions(diff)

    // Apply pulls to store
    if (toPull.length > 0) {
      const next = applyLeaves(args.localTokens, toPull)
      args.applyToStore(next)
    }

    // Push to Figma
    let unsupported: TokenLeaf[] = []
    if (toPush.length > 0) {
      const { payload, unsupported: u } = buildFigmaUpdatePayload(toPush, existing)
      unsupported = u
      const pushable = toPush.filter((l) => !u.some((x) => x.path === l.path))
      if (pushable.length > 0) await postVariables(args.fileKey, payload)
    }

    // New baseline = local + pulls applied (skipping unsupported & skipped from baseline so we re-detect next time)
    const baselineLeaves = mergeLeaves(args.baseLeaves, [...toPush, ...toPull])
    await args.saveBaseline(baselineLeaves)

    log.changes = { pushed: toPush, pulled: toPull, skipped, unsupported }
    return { ok: true, log, diff }
  } catch (e) {
    log.error = e instanceof Error ? e.message : "unknown"
    return { ok: false, log, diff: emptyDiff(0) }
  }
}

// ─── internals ───────────────────────────────────────────────────────────────

async function safeGet(fileKey: string) {
  try { return await getLocalVariables(fileKey) }
  catch { return null }
}

function baseLog(fileKey: string, direction: "pull" | "push" | "sync"): SyncLogEntry {
  return {
    id: newId(),
    fileKey,
    direction,
    conflictsCount: 0,
    changes: { pushed: [], pulled: [], skipped: [], unsupported: [] },
    timestamp: Date.now(),
  }
}

function emptyDiff(unchanged: number): SyncDiff {
  return { onlyLocal: [], onlyRemote: [], conflicts: [], unchanged }
}

function mergeLeaves(base: TokenLeaf[], updates: TokenLeaf[]): TokenLeaf[] {
  const map = new Map(base.map((l) => [l.path, l]))
  for (const u of updates) map.set(u.path, u)
  return Array.from(map.values())
}
