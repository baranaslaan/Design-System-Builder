// Score a list of component variants by rendering them into an offscreen
// container and running the a11y + brand scorers on the resulting DOM.

import { createRoot, type Root } from "react-dom/client"
import { flushSync } from "react-dom"
import type { DesignTokens } from "@/types/tokens"
import type { ComponentScore } from "@/types/scoring"
import { scoreA11y, a11yOverall } from "./a11y"
import { scoreBrand, brandOverall } from "./brand"

export interface ScoredVariant {
  component_id: string
  variant: string
  node: React.ReactNode
}

export async function scoreComponents(
  variants: ScoredVariant[],
  tokens: DesignTokens,
): Promise<ComponentScore[]> {
  if (typeof window === "undefined") return []

  // Offscreen but rendered (size 0 = no layout; use visibility:hidden instead)
  const host = document.createElement("div")
  host.setAttribute("data-scoring-host", "true")
  host.style.cssText = "position:fixed; left:-99999px; top:0; width:1280px; pointer-events:none;"
  document.body.appendChild(host)

  const results: ComponentScore[] = []

  // Group variants per component for per-mount scoring; one mount per variant
  // keeps scoring isolated and easier to attribute issues.
  for (const v of variants) {
    const slot = document.createElement("div")
    slot.style.cssText = "padding:24px; background: var(--background); color: var(--foreground);"
    host.appendChild(slot)

    let root: Root | null = null
    try {
      root = createRoot(slot)
      flushSync(() => { root!.render(v.node as React.ReactElement) })
      // wait a frame so layout/computed styles settle
      await new Promise(r => requestAnimationFrame(() => r(null)))

      const a11y = scoreA11y(slot)
      const brand = scoreBrand(slot, tokens)

      results.push({
        component_id: v.component_id,
        variant: v.variant,
        a11y_score: a11yOverall(a11y),
        brand_score: brandOverall(brand),
        breakdown: { a11y, brand },
      })
    } finally {
      try { root?.unmount() } catch { /* noop */ }
      slot.remove()
    }
  }

  host.remove()
  return results
}

export function aggregateByComponent(scores: ComponentScore[]): ComponentScore[] {
  const groups = new Map<string, ComponentScore[]>()
  for (const s of scores) {
    if (!groups.has(s.component_id)) groups.set(s.component_id, [])
    groups.get(s.component_id)!.push(s)
  }
  const agg: ComponentScore[] = []
  for (const [id, arr] of groups) {
    const avg = (k: "a11y_score" | "brand_score") =>
      Math.round(arr.reduce((sum, s) => sum + s[k], 0) / arr.length)
    agg.push({
      component_id: id, variant: null,
      a11y_score: avg("a11y_score"), brand_score: avg("brand_score"),
      breakdown: arr[0].breakdown, // representative; variants kept separately in DB
    })
  }
  return agg
}

export function hashTokens(tokens: DesignTokens): string {
  // tiny non-crypto hash for "did tokens change between runs"
  const s = JSON.stringify(tokens)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i), h |= 0
  return (h >>> 0).toString(16)
}
