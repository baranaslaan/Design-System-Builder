"use client"
// Tiny inline SVG sparkline. values 0..1.
export function Sparkline({ values, width = 80, height = 22 }: { values: number[]; width?: number; height?: number }) {
  if (!values.length) return <span className="text-[10px] text-[var(--muted-foreground)]">—</span>
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(0.0001, max - min)
  const step = values.length > 1 ? width / (values.length - 1) : 0
  const pts = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(" ")
  const last = values[values.length - 1]
  const first = values[0]
  const trend = last >= first
  const color = trend ? "var(--success, #10b981)" : "var(--danger, #ef4444)"
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={pts} />
      <circle cx={(values.length - 1) * step} cy={height - ((last - min) / range) * height} r={2} fill={color} />
    </svg>
  )
}
