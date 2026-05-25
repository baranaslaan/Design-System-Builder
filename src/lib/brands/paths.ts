// Path utilities for the flat path-map override format.
// Examples:
//   "colors.semantic.0.lightValue"
//   "spacing.4"
//   "typography.fontFamilies.sans"

export function getAt(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return undefined
    if (Array.isArray(acc)) {
      const i = parseInt(key, 10)
      return isFinite(i) ? acc[i] : undefined
    }
    return (acc as Record<string, unknown>)[key]
  }, obj)
}

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"])

export function assertSafePath(path: string): void {
  for (const p of path.split(".")) {
    if (FORBIDDEN_KEYS.has(p)) throw new Error(`Forbidden path segment: ${p}`)
  }
}

export function setAt(obj: Record<string, unknown>, path: string, value: unknown): void {
  assertSafePath(path)
  const parts = path.split(".")
  let cur: Record<string, unknown> | unknown[] = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    const next = parts[i + 1]
    const nextIsIndex = /^\d+$/.test(next)
    const isIndex = /^\d+$/.test(key)
    const k: string | number = isIndex && Array.isArray(cur) ? parseInt(key, 10) : key

    const child = Array.isArray(cur) ? (cur as unknown[])[k as number] : (cur as Record<string, unknown>)[k as string]
    if (child == null || typeof child !== "object") {
      const fresh: Record<string, unknown> | unknown[] = nextIsIndex ? [] : {}
      if (Array.isArray(cur)) (cur as unknown[])[k as number] = fresh
      else (cur as Record<string, unknown>)[k as string] = fresh
      cur = fresh
    } else {
      cur = child as Record<string, unknown> | unknown[]
    }
  }
  const last = parts[parts.length - 1]
  if (Array.isArray(cur)) (cur as unknown[])[parseInt(last, 10)] = value
  else (cur as Record<string, unknown>)[last] = value
}

// Recursively walk an object to produce a flat path map of scalar leaves.
// Arrays are addressed by numeric index.
export function flatten(obj: unknown, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (obj == null) return out
  if (typeof obj !== "object") { out[prefix] = obj; return out }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => Object.assign(out, flatten(v, prefix ? `${prefix}.${i}` : String(i))))
    return out
  }
  for (const [k, v] of Object.entries(obj)) {
    Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k))
  }
  return out
}
