// Minimal, self-contained variants used by the scoring engine. These render
// against the current CSS variables (--accent, --foreground, etc.) emitted by
// the token store, so scoring sees real token-driven styles.

import type { ScoredVariant } from "@/lib/scoring/engine"

const baseBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  fontFamily: "var(--font-sans)", fontSize: "var(--text-sm, 14px)",
  fontWeight: 600, padding: "var(--spacing-3, 12px) var(--spacing-4, 16px)",
  borderRadius: "var(--radius-md, 8px)", border: "1px solid transparent",
  cursor: "pointer", minWidth: 44, minHeight: 44, gap: 8,
  outline: "2px solid transparent", outlineOffset: 2,
}

export const SCORED_VARIANTS: ScoredVariant[] = [
  {
    component_id: "Button", variant: "primary",
    node: (
      <button type="button" style={{ ...baseBtn, background: "var(--accent)", color: "white" }}
        onFocus={e => (e.currentTarget.style.outlineColor = "var(--accent)")}
        onBlur={e => (e.currentTarget.style.outlineColor = "transparent")}>
        Primary action
      </button>
    ),
  },
  {
    component_id: "Button", variant: "ghost",
    node: (
      <button type="button" style={{ ...baseBtn, background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)" }}
        onFocus={e => (e.currentTarget.style.outlineColor = "var(--accent)")}
        onBlur={e => (e.currentTarget.style.outlineColor = "transparent")}>
        Ghost
      </button>
    ),
  },
  {
    component_id: "Badge", variant: "default",
    node: (
      <span style={{
        display: "inline-flex", padding: "var(--spacing-1, 4px) var(--spacing-2, 8px)",
        background: "var(--surface-2)", color: "var(--foreground)",
        fontSize: "var(--text-xs, 12px)", borderRadius: "var(--radius-full, 9999px)",
        fontFamily: "var(--font-sans)",
      }}>New</span>
    ),
  },
  {
    component_id: "Input", variant: "default",
    node: (
      <label style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--foreground)" }}>
        <span style={{ display: "block", marginBottom: 6 }}>Email</span>
        <input type="email" placeholder="you@example.com"
          style={{
            width: 280, minHeight: 44, padding: "0 12px",
            background: "var(--surface)", color: "var(--foreground)",
            border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)",
            fontFamily: "var(--font-sans)", fontSize: 14, outline: "2px solid transparent",
          }}
          onFocus={e => (e.currentTarget.style.outlineColor = "var(--accent)")}
          onBlur={e => (e.currentTarget.style.outlineColor = "transparent")}/>
      </label>
    ),
  },
  {
    component_id: "Card", variant: "default",
    node: (
      <div style={{
        padding: "var(--spacing-4, 16px)", background: "var(--surface)",
        border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)",
        fontFamily: "var(--font-sans)", color: "var(--foreground)", maxWidth: 320,
      }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Card title</h3>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--muted-foreground)" }}>
          Supporting body copy for the card content.
        </p>
      </div>
    ),
  },
  {
    component_id: "Alert", variant: "info",
    node: (
      <div role="status" style={{
        padding: "var(--spacing-3, 12px) var(--spacing-4, 16px)",
        background: "var(--surface-2)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md, 8px)", color: "var(--foreground)",
        fontFamily: "var(--font-sans)", fontSize: 14, maxWidth: 360,
      }}>
        Heads up — something needs your attention.
      </div>
    ),
  },
]
