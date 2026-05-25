"use client"
// Simple SVG line chart for an adoption-rate time series.
interface Point { taken_at: string; rate: number }
export function TrendChart({ points, height = 220 }: { points: Point[]; height?: number }) {
  if (!points.length) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-[var(--muted-foreground)]">
        No snapshot data yet — run a scan to start recording trends.
      </div>
    )
  }
  const W = 720, H = height, P = 28
  const xs = points.map((_, i) => P + (i * (W - 2 * P)) / Math.max(1, points.length - 1))
  const ys = points.map(p => H - P - p.rate * (H - 2 * P))
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ")
  const area = `${path} L${xs[xs.length - 1]},${H - P} L${xs[0]},${H - P} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <g key={t}>
          <line x1={P} x2={W - P} y1={H - P - t * (H - 2 * P)} y2={H - P - t * (H - 2 * P)}
            stroke="var(--border)" strokeDasharray="2 4" />
          <text x={P - 6} y={H - P - t * (H - 2 * P) + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      <path d={area} fill="var(--accent)" opacity="0.12" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />
      {points.length <= 30 && xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={2.5} fill="var(--accent)" />
      ))}
      {points.length > 1 && (
        <>
          <text x={P} y={H - 8} fontSize="9" fill="var(--muted-foreground)">{points[0].taken_at}</text>
          <text x={W - P} y={H - 8} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
            {points[points.length - 1].taken_at}
          </text>
        </>
      )}
    </svg>
  )
}
