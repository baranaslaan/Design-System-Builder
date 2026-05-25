"use client"
import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Box, Play, Pause, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Scene3D } from "@/components/spatial/Scene3D"
import { SpatialControls } from "@/components/spatial/SpatialControls"
import { CssOutput } from "@/components/spatial/CssOutput"
import { DEFAULT_SCENE, PATTERNS, type SceneState } from "@/lib/spatial/scene"
import { exportSceneCss } from "@/lib/spatial/exportCss"

export default function SpatialPage() {
  const [scene, setScene] = useState<SceneState>(DEFAULT_SCENE)
  const [patternId, setPatternId] = useState(PATTERNS[0].id)
  const [animated, setAnimated] = useState(false)
  const pattern = useMemo(() => PATTERNS.find(p => p.id === patternId)!, [patternId])
  const css = useMemo(() => exportSceneCss(scene, pattern), [scene, pattern])

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)] sticky top-0 z-20 bg-[var(--background)]">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={14} /> Back to editor
        </Link>
        <div className="h-5 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold flex items-center gap-1.5"><Box size={14} /> 3D Spatial Preview</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant={animated ? "accent" : "ghost"} size="sm" onClick={() => setAnimated(a => !a)} className="gap-1.5">
            {animated ? <Pause size={12} /> : <Play size={12} />} {animated ? "Pause" : "Auto-rotate"}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-12 gap-4">
        {/* Pattern picker */}
        <div className="col-span-12 flex items-center gap-2 flex-wrap">
          {PATTERNS.map(p => (
            <button key={p.id} onClick={() => setPatternId(p.id)}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                patternId === p.id
                  ? "border-[var(--accent)] bg-[var(--surface-2)] text-[var(--foreground)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
              }`}>
              {p.name}
            </button>
          ))}
          <p className="ml-2 text-[11px] text-[var(--muted-foreground)] italic flex-1 truncate">{pattern.description}</p>
        </div>

        {/* Stage */}
        <section className="col-span-12 md:col-span-8 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
            <h2 className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Stage</h2>
            <span className="ml-auto text-[10px] text-[var(--muted-foreground)] font-mono">
              {pattern.layers.length} layers · z up to {Math.max(...pattern.layers.map(l => l.z))}px
            </span>
          </div>
          <Scene3D scene={scene} pattern={pattern} animated={animated} />
        </section>

        {/* Controls */}
        <aside className="col-span-12 md:col-span-4 space-y-3">
          <SpatialControls scene={scene} onChange={setScene} />
          <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
              <Video size={11} /> Capture
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              For GIF/video, hit <kbd className="font-mono bg-[var(--surface-2)] px-1 rounded">⌘⇧5</kbd> (macOS)
              or use your OS screen recorder against this viewport. The exported CSS includes
              an animated <code className="font-mono">@keyframes</code> rule for docs.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setScene(DEFAULT_SCENE)} className="w-full text-[10px]">
              Reset scene
            </Button>
          </div>
        </aside>

        {/* CSS export */}
        <div className="col-span-12">
          <CssOutput css={css} />
        </div>
      </main>
    </div>
  )
}
