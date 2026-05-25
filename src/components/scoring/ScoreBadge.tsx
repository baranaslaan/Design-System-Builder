"use client"
// Compact score chip — colored by threshold.
export function ScoreBadge({ label, value, size = "md" }: { label: string; value: number; size?: "sm" | "md" }) {
  const color = value >= 90 ? "#10b981" : value >= 75 ? "#f59e0b" : "var(--danger)"
  const bg    = value >= 90 ? "rgba(16,185,129,0.10)" : value >= 75 ? "rgba(245,158,11,0.10)" : "rgba(239,68,68,0.10)"
  const pad   = size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
  return (
    <span className={`inline-flex items-center gap-1 ${pad} rounded font-mono font-semibold`}
      style={{ color, background: bg }}>
      <span className="opacity-70">{label}</span>
      <span className="tabular-nums">{Math.round(value)}</span>
    </span>
  )
}
