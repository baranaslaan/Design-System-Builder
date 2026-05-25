// Rule-based severity assignment. The AI layer can override these.
import type { Severity, FindingKind } from "@/types/audit"

interface Input {
  kind: FindingKind
  raw: string
  suggested: string | null
  distance?: number // px or color distance, if known
}

export function classifySeverity(i: Input): { severity: Severity; confidence: number; reason: string } {
  // Has a precise suggestion (small distance) → warning
  // No suggestion at all → critical (truly off-system)
  // Tiny px deviations (1–2px) → info
  const k = i.kind

  if (k === "color" || k === "figma-fill" || k === "figma-stroke") {
    if (i.suggested) {
      const d = i.distance ?? 0
      if (d < 6) return { severity: "info",     confidence: 0.95, reason: "Very close to existing token" }
      if (d < 16) return { severity: "warning", confidence: 0.85, reason: "Near-token color — replace with the closest token" }
      return { severity: "warning", confidence: 0.7, reason: "Off-token color but a candidate exists" }
    }
    return { severity: "critical", confidence: 0.9, reason: "No matching color token — appears to be off-system" }
  }

  if (k === "spacing" || k === "radius" || k === "font-size" || k === "figma-text") {
    if (i.suggested) {
      const d = i.distance ?? 0
      if (d <= 1) return { severity: "info",    confidence: 0.95, reason: "1px deviation from token" }
      if (d <= 4) return { severity: "warning", confidence: 0.8,  reason: "Small numeric deviation — snap to token" }
      return { severity: "warning", confidence: 0.7, reason: "Off scale" }
    }
    return { severity: "critical", confidence: 0.85, reason: "Value not on the design scale" }
  }

  if (k === "shadow") {
    return i.suggested
      ? { severity: "warning", confidence: 0.7, reason: "Custom shadow — prefer a token" }
      : { severity: "critical", confidence: 0.8, reason: "Hand-rolled shadow not on the elevation scale" }
  }

  return { severity: "info", confidence: 0.5, reason: "Heuristic finding" }
}
