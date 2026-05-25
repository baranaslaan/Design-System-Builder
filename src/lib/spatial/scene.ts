// Scene state model — rotation, zoom, light vector, and layered patterns.
// Layers are positioned along the z-axis; shadows are computed from the
// light vector for a believable depth effect without WebGL.

export interface LightSource {
  azimuth: number   // degrees, 0 = right, 90 = top
  elevation: number // degrees, 0 = horizon, 90 = directly above
  intensity: number // 0..1
}

export interface SceneState {
  rotateX: number   // tilt
  rotateY: number   // spin
  zoom: number      // 0.4..2.5
  light: LightSource
}

export const DEFAULT_SCENE: SceneState = {
  rotateX: 18,
  rotateY: -20,
  zoom: 1,
  light: { azimuth: 135, elevation: 55, intensity: 0.85 },
}

export interface DepthLayerSpec {
  id: string
  label: string
  z: number          // px along z-axis
  width: number
  height: number
  fill: string
  radius: number
  content?: React.ReactNode
}

export interface SpatialPattern {
  id: string
  name: string
  description: string
  layers: DepthLayerSpec[]
}

// Compute the box-shadow for a layer given the scene's light vector.
// Higher z + lower elevation → longer, softer shadow.
export function shadowFor(z: number, light: LightSource): string {
  const az = (light.azimuth * Math.PI) / 180
  const el = (light.elevation * Math.PI) / 180
  // Offset proportional to z; cos(elevation) makes high sun = short shadow.
  const dist = z * 0.6 * Math.max(0.1, Math.cos(el))
  const dx = Math.round(Math.cos(az) * dist)
  const dy = Math.round(-Math.sin(az) * dist)
  const blur = Math.round(8 + z * 0.8)
  const alpha = Math.max(0.08, Math.min(0.4, light.intensity * (z / 80)))
  return `${dx}px ${dy}px ${blur}px rgba(0,0,0,${alpha.toFixed(3)})`
}

// Built-in patterns demonstrating common layered UI.
export const PATTERNS: SpatialPattern[] = [
  {
    id: "elevated-card",
    name: "Elevated Card",
    description: "Card with content panel + lifted action button.",
    layers: [
      { id: "bg",     label: "background", z: 0,  width: 320, height: 200, fill: "var(--surface-2)", radius: 12 },
      { id: "card",   label: "card",       z: 30, width: 280, height: 160, fill: "var(--surface)",   radius: 12 },
      { id: "action", label: "action",     z: 60, width: 120, height: 36,  fill: "var(--accent)",    radius: 8  },
    ],
  },
  {
    id: "modal-backdrop",
    name: "Modal + Backdrop",
    description: "Dim backdrop, lifted modal panel, focused button.",
    layers: [
      { id: "bg",       label: "page",     z: 0,  width: 380, height: 240, fill: "var(--surface-2)",  radius: 8 },
      { id: "backdrop", label: "backdrop", z: 20, width: 380, height: 240, fill: "rgba(0,0,0,0.55)",  radius: 8 },
      { id: "modal",    label: "modal",    z: 70, width: 280, height: 160, fill: "var(--surface)",    radius: 14 },
      { id: "cta",      label: "primary",  z: 100, width: 100, height: 32, fill: "var(--accent)",     radius: 8 },
    ],
  },
  {
    id: "floating-nav",
    name: "Floating Navigation",
    description: "Sticky bottom nav floating above content.",
    layers: [
      { id: "content", label: "content",   z: 0,  width: 320, height: 240, fill: "var(--surface)",    radius: 16 },
      { id: "nav",     label: "nav bar",   z: 50, width: 240, height: 56,  fill: "var(--surface-2)",  radius: 28 },
      { id: "fab",     label: "FAB",       z: 90, width: 56,  height: 56,  fill: "var(--accent)",     radius: 28 },
    ],
  },
]
