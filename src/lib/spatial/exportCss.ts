// Emit a self-contained CSS snippet that reproduces the current 3D pose +
// shadow as a static layout, AND a @keyframes rotation animation for docs.
import { shadowFor, type SceneState, type SpatialPattern } from "./scene"

export function exportSceneCss(scene: SceneState, pattern: SpatialPattern): string {
  const root = `.scene-${pattern.id}`
  const layerRules = pattern.layers.map((l, i) => `
${root} .layer-${l.id} {
  position: absolute;
  width: ${l.width}px;
  height: ${l.height}px;
  border-radius: ${l.radius}px;
  background: ${l.fill};
  transform: translate(-50%, -50%) translateZ(${l.z}px);
  left: 50%; top: 50%;
  box-shadow: ${shadowFor(l.z, scene.light)};
  z-index: ${i};
}`).join("")

  return `/* 3D Spatial preview — pattern: ${pattern.name} */
${root} {
  perspective: 1200px;
  transform-style: preserve-3d;
  width: 100%; height: 360px;
  display: grid; place-items: center;
}
${root} .stage {
  position: relative;
  width: 400px; height: 280px;
  transform-style: preserve-3d;
  transform: rotateX(${scene.rotateX}deg) rotateY(${scene.rotateY}deg) scale(${scene.zoom});
  transition: transform 0.4s ease;
}
${layerRules}

/* Animated rotation for docs */
@keyframes ${pattern.id}-spin {
  from { transform: rotateX(${scene.rotateX}deg) rotateY(${scene.rotateY - 30}deg) scale(${scene.zoom}); }
  to   { transform: rotateX(${scene.rotateX}deg) rotateY(${scene.rotateY + 30}deg) scale(${scene.zoom}); }
}
${root}.animated .stage {
  animation: ${pattern.id}-spin 4s ease-in-out infinite alternate;
}
`
}
