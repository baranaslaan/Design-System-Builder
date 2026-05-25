"use client"
import { RotateCw, ZoomIn, Sun } from "lucide-react"
import type { SceneState } from "@/lib/spatial/scene"

export function SpatialControls({ scene, onChange }: {
  scene: SceneState; onChange: (next: SceneState) => void
}) {
  const set = (patch: Partial<SceneState>) => onChange({ ...scene, ...patch })
  const setLight = (p: Partial<SceneState["light"]>) => onChange({ ...scene, light: { ...scene.light, ...p } })

  return (
    <div className="space-y-3">
      <Group icon={<RotateCw size={11} />} label="Rotation">
        <Slider label="X (tilt)" value={scene.rotateX} min={-60} max={60}
          onChange={v => set({ rotateX: v })} unit="°" />
        <Slider label="Y (spin)" value={scene.rotateY} min={-90} max={90}
          onChange={v => set({ rotateY: v })} unit="°" />
      </Group>
      <Group icon={<ZoomIn size={11} />} label="Zoom">
        <Slider label="Scale" value={scene.zoom} min={0.4} max={2.5} step={0.05}
          onChange={v => set({ zoom: v })} unit="×" />
      </Group>
      <Group icon={<Sun size={11} />} label="Light">
        <Slider label="Azimuth"   value={scene.light.azimuth}   min={0} max={360}
          onChange={v => setLight({ azimuth: v })} unit="°" />
        <Slider label="Elevation" value={scene.light.elevation} min={0} max={90}
          onChange={v => setLight({ elevation: v })} unit="°" />
        <Slider label="Intensity" value={scene.light.intensity} min={0} max={1} step={0.05}
          onChange={v => setLight({ intensity: v })} />
      </Group>
    </div>
  )
}

function Group({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
        {icon}{label}
      </div>
      {children}
    </div>
  )
}

function Slider({ label, value, min, max, step = 1, unit = "", onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--accent)]" />
    </div>
  )
}
