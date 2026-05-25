"use client"
// Pure CSS-3D scene: stage with perspective, layered depth panels with
// dynamically-computed shadows from the light vector.
import { shadowFor, type SceneState, type SpatialPattern } from "@/lib/spatial/scene"

export function Scene3D({ scene, pattern, animated }: {
  scene: SceneState; pattern: SpatialPattern; animated?: boolean
}) {
  return (
    <div style={{ perspective: 1200, width: "100%", height: 380, display: "grid", placeItems: "center" }}>
      <div style={{
        position: "relative", width: 400, height: 280,
        transformStyle: "preserve-3d",
        transform: `rotateX(${scene.rotateX}deg) rotateY(${scene.rotateY}deg) scale(${scene.zoom})`,
        transition: "transform 0.25s ease",
        animation: animated ? "spatial-spin 4s ease-in-out infinite alternate" : undefined,
      }}>
        <style>{`@keyframes spatial-spin {
          from { transform: rotateX(${scene.rotateX}deg) rotateY(${scene.rotateY - 30}deg) scale(${scene.zoom}); }
          to   { transform: rotateX(${scene.rotateX}deg) rotateY(${scene.rotateY + 30}deg) scale(${scene.zoom}); }
        }`}</style>
        {pattern.layers.map((l, i) => (
          <div key={l.id} style={{
            position: "absolute",
            width: l.width, height: l.height, borderRadius: l.radius,
            background: l.fill,
            left: "50%", top: "50%",
            transform: `translate(-50%, -50%) translateZ(${l.z}px)`,
            boxShadow: shadowFor(l.z, scene.light),
            zIndex: i,
            display: "grid", placeItems: "center",
            color: "var(--foreground)", fontSize: 12, fontFamily: "var(--font-sans)",
          }}>
            <span style={{ opacity: 0.55, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
