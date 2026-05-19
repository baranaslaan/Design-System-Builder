"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, RotateCcw, Copy } from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { Button } from "@/components/ui/button"
import { gradientToCss } from "@/lib/utils"
import type { GradientToken, GradientStop } from "@/types/tokens"
import { copyToClipboard } from "@/lib/utils"

const GRADIENT_TYPES: GradientToken["type"][] = ["linear", "radial", "conic"]

// ── Gradient CSS helper for display ───────────────────────────────────────
function makePreviewCss(g: GradientToken): string {
  return gradientToCss(g)
}

// ── Stop handle on the gradient bar ───────────────────────────────────────
function StopHandle({
  stop, selected, total,
  onSelect, onDelete,
}: {
  stop: GradientStop
  selected: boolean
  total: number
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="absolute top-full translate-y-1 -translate-x-1/2 flex flex-col items-center group"
      style={{ left: `${stop.position}%` }}
    >
      {/* Triangle pointer */}
      <div
        className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent"
        style={{ borderBottomColor: selected ? "var(--accent)" : "var(--border)" }}
      />
      {/* Color swatch handle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onSelect}
        onDoubleClick={e => { e.stopPropagation(); if (total > 2) onDelete() }}
        className="w-4 h-4 rounded-full border-2 shadow-md transition-all"
        style={{
          background: stop.color,
          borderColor: selected ? "var(--accent)" : "white",
          boxShadow: selected ? "0 0 0 2px var(--accent)" : undefined,
        }}
        title={`${stop.color} @ ${stop.position}% — double-click to delete`}
      />
    </div>
  )
}

// ── Gradient card / editor ─────────────────────────────────────────────────
function GradientCard({ gradient }: { gradient: GradientToken }) {
  const { updateGradient, removeGradient } = useTokensStore()
  const [selectedStop, setSelectedStop] = useState<string | null>(gradient.stops[0]?.id ?? null)
  const barRef = useRef<HTMLDivElement>(null)

  const css = makePreviewCss(gradient)
  const stop = gradient.stops.find(s => s.id === selectedStop)

  const update = (patch: Partial<GradientToken>) => updateGradient({ ...gradient, ...patch })

  const updateStop = (id: string, patch: Partial<GradientStop>) =>
    update({ stops: gradient.stops.map(s => s.id === id ? { ...s, ...patch } : s) })

  // Click on gradient bar to add new stop
  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const pos  = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    // Interpolate color at that position
    const sorted = [...gradient.stops].sort((a, b) => a.position - b.position)
    const before = sorted.findLast(s => s.position <= pos) ?? sorted[0]
    const newId = `s-${Date.now()}`
    update({
      stops: [...gradient.stops, { id: newId, color: before.color, position: pos, opacity: 1 }],
    })
    setSelectedStop(newId)
  }, [gradient])

  // Drag stop position
  const handleStopDrag = useCallback((stopId: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const move = (me: MouseEvent) => {
      const pos = Math.max(0, Math.min(100, Math.round(((me.clientX - rect.left) / rect.width) * 100)))
      updateStop(stopId, { position: pos })
    }
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
  }, [gradient])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group flex flex-col gap-3 p-4 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)]"
    >
      {/* Name + delete */}
      <div className="flex items-center gap-2">
        <input
          className="flex-1 bg-transparent text-sm font-semibold text-[var(--foreground)] focus:outline-none border-b border-transparent focus:border-[var(--accent)] pb-0.5 transition-colors"
          value={gradient.name}
          onChange={e => update({ name: e.target.value })}
        />
        <button
          onClick={() => copyToClipboard(css)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-[var(--foreground)]"
          title="Copy CSS"
        >
          <Copy size={12} />
        </button>
        <Button variant="ghost" size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-400"
          onClick={() => removeGradient(gradient.id)}>
          <Trash2 size={13} />
        </Button>
      </div>

      {/* Large preview */}
      <div
        className="w-full h-20 rounded-xl shadow-inner cursor-crosshair relative"
        style={{ background: css }}
        onClick={handleBarClick}
        title="Click to add color stop"
      />

      {/* Stop bar */}
      <div className="relative mb-6">
        <div
          ref={barRef}
          className="h-5 rounded-full overflow-visible cursor-crosshair relative"
          style={{ background: css }}
          onClick={handleBarClick}
        >
          {/* Checkerboard for transparency hint */}
        </div>
        {/* Stop handles */}
        {gradient.stops.map(s => (
          <div
            key={s.id}
            className="absolute top-0 h-5"
            style={{ left: `${s.position}%` }}
            onMouseDown={handleStopDrag(s.id)}
            onClick={e => { e.stopPropagation(); setSelectedStop(s.id) }}
          >
            <StopHandle
              stop={s}
              selected={selectedStop === s.id}
              total={gradient.stops.length}
              onSelect={() => setSelectedStop(s.id)}
              onDelete={() => {
                update({ stops: gradient.stops.filter(x => x.id !== s.id) })
                setSelectedStop(gradient.stops[0]?.id ?? null)
              }}
            />
          </div>
        ))}
      </div>

      {/* Stop editor */}
      {stop && (
        <motion.div
          layout
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-2 flex-wrap"
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0"
            style={{ background: stop.color }}>
            <input type="color" value={stop.color}
              onChange={e => updateStop(stop.id, { color: e.target.value })}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          </div>
          <input
            className="bg-[var(--surface-3)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs font-mono text-[var(--foreground)] w-24 focus:outline-none focus:border-[var(--accent)] transition-colors"
            value={stop.color}
            onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && updateStop(stop.id, { color: e.target.value })}
          />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[var(--muted)]">Pos</span>
            <input type="range" min={0} max={100} value={stop.position}
              onChange={e => updateStop(stop.id, { position: Number(e.target.value) })}
              className="w-20 accent-[var(--accent)]" />
            <span className="text-[10px] font-mono text-[var(--muted)] w-8">{stop.position}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[var(--muted)]">Alpha</span>
            <input type="range" min={0} max={100} value={Math.round(stop.opacity * 100)}
              onChange={e => updateStop(stop.id, { opacity: Number(e.target.value) / 100 })}
              className="w-16 accent-[var(--accent)]" />
            <span className="text-[10px] font-mono text-[var(--muted)] w-8">{Math.round(stop.opacity * 100)}%</span>
          </div>
        </motion.div>
      )}

      {/* Type + angle controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Type selector */}
        <div className="flex gap-0.5 bg-[var(--surface-3)] rounded-lg p-0.5">
          {GRADIENT_TYPES.map(t => (
            <button key={t}
              onClick={() => update({ type: t })}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium capitalize transition-all"
              style={{
                background: gradient.type === t ? "var(--surface-2)" : "transparent",
                color: gradient.type === t ? "var(--foreground)" : "var(--muted)",
                border: gradient.type === t ? "1px solid var(--border)" : "1px solid transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Angle (only for linear/conic) */}
        {gradient.type !== "radial" && (
          <div className="flex items-center gap-1.5 flex-1">
            <input type="range" min={0} max={360} value={gradient.angle}
              onChange={e => update({ angle: Number(e.target.value) })}
              className="flex-1 accent-[var(--accent)]" />
            <div className="flex items-center gap-1">
              <input
                type="number" min={0} max={360} value={gradient.angle}
                onChange={e => update({ angle: Number(e.target.value) })}
                className="w-12 bg-[var(--surface-3)] border border-[var(--border)] rounded-md px-1.5 py-0.5 text-xs font-mono text-[var(--foreground)] text-center focus:outline-none focus:border-[var(--accent)]"
              />
              <button onClick={() => update({ angle: (gradient.angle + 45) % 360 })}
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors" title="Rotate 45°">
                <RotateCcw size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS value */}
      <div className="flex items-center gap-2 bg-[var(--surface-3)] rounded-lg px-3 py-1.5 overflow-hidden">
        <code className="text-[10px] font-mono text-[var(--muted)] truncate flex-1">{css}</code>
      </div>
    </motion.div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────
export function GradientsPanel({ filter = "" }: { filter?: string }) {
  const { tokens, addGradient } = useTokensStore()
  const q = filter.toLowerCase()
  const visible = (tokens.gradients ?? []).filter(g =>
    !q || g.name.toLowerCase().includes(q) || g.id.includes(q) || g.type.includes(q)
  )

  const handleAdd = () => {
    addGradient({
      id: `gradient-${Date.now()}`,
      name: "New Gradient",
      type: "linear",
      angle: 135,
      stops: [
        { id: `s1-${Date.now()}`, color: "#7c3aed", position: 0,   opacity: 1 },
        { id: `s2-${Date.now()}`, color: "#ec4899", position: 100, opacity: 1 },
      ],
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {visible.map(g => <GradientCard key={g.id} gradient={g} />)}
      </AnimatePresence>

      {visible.length === 0 && !q && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }} />
          <p className="text-sm text-[var(--muted)]">No gradients yet</p>
          <p className="text-xs text-[var(--muted)] mt-1 opacity-60">Click below to add your first gradient</p>
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={handleAdd}
        className="w-full justify-start gap-2 text-[var(--muted)]">
        <Plus size={13} /> Add gradient
      </Button>
    </div>
  )
}
