import type { ComponentScore, ScoreDiff } from "@/types/scoring"

export function diffRuns(prev: ComponentScore[], curr: ComponentScore[]): ScoreDiff[] {
  const prevMap = new Map(prev.filter(s => s.variant === null).map(s => [s.component_id, s]))
  const out: ScoreDiff[] = []
  for (const c of curr.filter(s => s.variant === null)) {
    const p = prevMap.get(c.component_id)
    if (!p) continue
    const prevIssues = new Map(p.breakdown.a11y.issues.map(i => [i.id, i]))
    const currIssues = new Map(c.breakdown.a11y.issues.map(i => [i.id, i]))
    const newIssues = [...currIssues.values()].filter(i => !prevIssues.has(i.id))
    const resolvedIssues = [...prevIssues.values()].filter(i => !currIssues.has(i.id))
    out.push({
      component_id: c.component_id,
      a11y_before: p.a11y_score, a11y_after: c.a11y_score,
      a11y_delta: c.a11y_score - p.a11y_score,
      brand_before: p.brand_score, brand_after: c.brand_score,
      brand_delta: c.brand_score - p.brand_score,
      newIssues, resolvedIssues,
    })
  }
  return out.sort((a, b) => (a.a11y_delta + a.brand_delta) - (b.a11y_delta + b.brand_delta))
}
