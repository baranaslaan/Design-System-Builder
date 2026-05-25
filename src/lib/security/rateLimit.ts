// In-memory token bucket. Per-process — fine for single-region Vercel /
// Node. For multi-instance deployments, swap for Upstash/Redis later.

interface Bucket { tokens: number; refilledAt: number }
const buckets = new Map<string, Bucket>()

interface Limit { capacity: number; refillPerSec: number }

export function consumeToken(key: string, limit: Limit): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const b = buckets.get(key) ?? { tokens: limit.capacity, refilledAt: now }
  const elapsed = (now - b.refilledAt) / 1000
  const replenished = Math.min(limit.capacity, b.tokens + elapsed * limit.refillPerSec)
  if (replenished < 1) {
    const need = 1 - replenished
    const retryAfter = Math.ceil(need / limit.refillPerSec)
    buckets.set(key, { tokens: replenished, refilledAt: now })
    return { ok: false, retryAfter }
  }
  buckets.set(key, { tokens: replenished - 1, refilledAt: now })
  return { ok: true, retryAfter: 0 }
}

// Helper for route handlers — returns a NextResponse on deny, or null on allow.
import { NextResponse } from "next/server"

export function rateLimitOrDeny(key: string, limit: Limit): NextResponse | null {
  const r = consumeToken(key, limit)
  if (r.ok) return null
  return NextResponse.json(
    { error: "rate_limited", retry_after: r.retryAfter },
    { status: 429, headers: { "Retry-After": String(r.retryAfter) } }
  )
}

// Common presets.
export const LIMITS = {
  scan:    { capacity: 3,  refillPerSec: 3 / 60 },  // 3 / minute, burst 3
  audit:   { capacity: 3,  refillPerSec: 3 / 60 },
  scoring: { capacity: 6,  refillPerSec: 6 / 60 },
  write:   { capacity: 30, refillPerSec: 30 / 60 },
}
