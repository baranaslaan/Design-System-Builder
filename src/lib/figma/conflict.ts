// 3-way merge: classify each token as onlyLocal / onlyRemote / conflict / unchanged
// by comparing the base (last-synced) snapshot to the current local and remote leaves.

import type { SyncDiff, TokenLeaf, TokenConflict } from "./types"

const eq = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  if (typeof a === "object") return JSON.stringify(a) === JSON.stringify(b)
  return false
}

const byPath = (leaves: TokenLeaf[]) => {
  const m = new Map<string, TokenLeaf>()
  for (const l of leaves) m.set(l.path, l)
  return m
}

/**
 * 3-way merge classification.
 *   base   — snapshot from last successful sync (or [] for first run)
 *   local  — current code state
 *   remote — just fetched from Figma
 */
export function computeDiff(base: TokenLeaf[], local: TokenLeaf[], remote: TokenLeaf[]): SyncDiff {
  const baseMap   = byPath(base)
  const localMap  = byPath(local)
  const remoteMap = byPath(remote)

  const allPaths = new Set<string>([...localMap.keys(), ...remoteMap.keys(), ...baseMap.keys()])

  const onlyLocal:  TokenLeaf[]     = []
  const onlyRemote: TokenLeaf[]     = []
  const conflicts:  TokenConflict[] = []
  let unchanged = 0

  for (const path of allPaths) {
    const b = baseMap.get(path)
    const l = localMap.get(path)
    const r = remoteMap.get(path)

    const localChanged  = !!l && (!b || !eq(b.value, l.value))
    const remoteChanged = !!r && (!b || !eq(b.value, r.value))

    // Deletions: present in base but missing on one side
    const localDeleted  = !!b && !l
    const remoteDeleted = !!b && !r

    if (!l && !r) continue  // both gone — drop
    if (!localChanged && !remoteChanged && !localDeleted && !remoteDeleted) {
      // Either identical to base, or new on both sides with the same value
      if (l && r && eq(l.value, r.value)) { unchanged++; continue }
      // New on only one side with no base
      if (l && !b && !r) { onlyLocal.push(l); continue }
      if (r && !b && !l) { onlyRemote.push(r); continue }
      unchanged++
      continue
    }

    // If both sides changed (and to different values) → conflict
    if (l && r && localChanged && remoteChanged && !eq(l.value, r.value)) {
      conflicts.push({
        path,
        type: l.type,
        baseValue: b?.value,
        localValue: l.value,
        remoteValue: r.value,
      })
      continue
    }

    if (localChanged && r && eq(l!.value, r.value)) { unchanged++; continue }
    if (localChanged || localDeleted) {
      if (l) onlyLocal.push(l)
      // (deletion-only push is out of scope for v1)
      continue
    }
    if (remoteChanged || remoteDeleted) {
      if (r) onlyRemote.push(r)
      continue
    }
  }

  return { onlyLocal, onlyRemote, conflicts, unchanged }
}

/** After the user resolves conflicts, partition them into push-set and pull-set. */
export function applyResolutions(diff: SyncDiff): { toPush: TokenLeaf[]; toPull: TokenLeaf[]; skipped: TokenLeaf[] } {
  const toPush: TokenLeaf[] = [...diff.onlyLocal]
  const toPull: TokenLeaf[] = [...diff.onlyRemote]
  const skipped: TokenLeaf[] = []

  for (const c of diff.conflicts) {
    if (c.resolution === "local")  toPush.push({ path: c.path, type: c.type, value: c.localValue })
    else if (c.resolution === "remote") toPull.push({ path: c.path, type: c.type, value: c.remoteValue })
    else skipped.push({ path: c.path, type: c.type, value: c.localValue })
  }
  return { toPush, toPull, skipped }
}
