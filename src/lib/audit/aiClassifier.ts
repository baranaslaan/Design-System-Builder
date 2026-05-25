// Optional Claude pass: takes rule-based findings and returns refined
// severity + a one-line human-readable reason. Falls back to passthrough
// when ANTHROPIC_API_KEY is missing.

import type { Severity } from "@/types/audit"

const API = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-3-5-haiku-latest"

export interface ClassifyInput {
  kind: string
  raw: string
  location: string
  suggested: string | null
  base_severity: Severity
}
export interface ClassifyOutput {
  severity: Severity
  reason: string
  confidence: number
}

const PROMPT = `You are auditing a design system for consistency.
For each finding, return refined severity ("critical" | "warning" | "info"),
a 1-sentence reason (max 90 chars), and confidence (0-1).
- "critical" = clearly off-system, no good token match, harms brand/a11y
- "warning"  = near-token deviation that should snap to an existing token
- "info"     = trivial deviation (≤1px, alpha noise) or ambiguous

Return ONLY a JSON array, same length and order as the input, items:
{"severity":"...", "reason":"...", "confidence":0.x}`

export async function classifyWithAI(items: ClassifyInput[]): Promise<ClassifyOutput[] | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || items.length === 0) return null

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: PROMPT,
        messages: [{ role: "user", content: JSON.stringify(items) }],
      }),
    })
    if (!res.ok) return null
    const j = await res.json()
    const text = j?.content?.[0]?.text ?? ""
    // Extract JSON array (allow leading/trailing chatter)
    const m = text.match(/\[[\s\S]*\]/)
    if (!m) return null
    const arr = JSON.parse(m[0]) as ClassifyOutput[]
    if (!Array.isArray(arr) || arr.length !== items.length) return null
    return arr
  } catch {
    return null
  }
}

export const AI_MODEL_ID = MODEL
