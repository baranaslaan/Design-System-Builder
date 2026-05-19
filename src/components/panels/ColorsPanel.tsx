"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronRight, Link, Link2Off } from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { Button } from "@/components/ui/button"
import { CopyBadge } from "@/components/ui/CopyBadge"
import {
  generateShades, getContrastColor, resolveRef, buildAliasOptions,
  contrastRatio, wcagLevel, wcagLevelColor,
} from "@/lib/utils"
import type { ColorPalette, SemanticColor } from "@/types/tokens"

const SHADE_KEYS = ["50","100","200","300","400","500","600","700","800","900","950"]

// ─── Palette row ──────────────────────────────────────────────────────────
function PaletteRow({ palette }: { palette: ColorPalette }) {
  const { updateColorPalette, removeColorPalette } = useTokensStore()
  const [expanded, setExpanded] = useState(false)

  const handleBaseColorChange = (hex: string) => {
    updateColorPalette({ ...palette, shades: generateShades(hex) as ColorPalette["shades"] })
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={14} className="text-[var(--muted)]" />
        </motion.div>
        <div className="flex gap-0.5 rounded-md overflow-hidden flex-shrink-0">
          {SHADE_KEYS.map(shade => (
            <div key={shade} className="h-6 w-4" style={{ background: palette.shades[shade] }} />
          ))}
        </div>
        <span className="text-sm font-medium text-[var(--foreground)] flex-1">{palette.name}</span>
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <input type="color" defaultValue={palette.shades[500]}
            onChange={e => handleBaseColorChange(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0" title="Base color" />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--muted)] hover:text-red-400"
            onClick={() => removeColorPalette(palette.id)}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
            <div className="px-4 pb-4 pt-2 grid grid-cols-11 gap-1.5 border-t border-[var(--border)]">
              {SHADE_KEYS.map(shade => {
                const color = palette.shades[shade]
                const textColor = getContrastColor(color)
                return (
                  <div key={shade} className="flex flex-col gap-1 items-center group/shade">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden cursor-pointer"
                      style={{ background: color }}>
                      <input type="color" value={color}
                        onChange={e => updateColorPalette({ ...palette, shades: { ...palette.shades, [shade]: e.target.value } })}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/shade:opacity-100 transition-opacity"
                        style={{ color: textColor }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      </div>
                    </div>
                    <CopyBadge
                      cssVar={`--color-${palette.id}-${shade}`}
                      value={color}
                      className="opacity-0 group-hover/shade:opacity-100 transition-opacity w-full justify-center"
                    />
                    <span className="text-[10px] text-[var(--muted)] font-mono group-hover/shade:hidden">{shade}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Alias picker ─────────────────────────────────────────────────────────
function AliasPicker({
  value, onSelect, palettes, onClear,
}: {
  value?: string
  onSelect: (ref: string, hex: string) => void
  palettes: ColorPalette[]
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const options = buildAliasOptions(palettes)
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { if (value) { onClear() } else { setOpen(!open) } }}
        className="flex items-center justify-center w-5 h-5 rounded transition-colors hover:bg-[var(--surface-3)]"
        title={value ? `Alias: ${value} — click to clear` : "Set alias"}
      >
        {value
          ? <Link size={10} className="text-[var(--accent)]" />
          : <Link2Off size={10} className="text-[var(--muted)]" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 z-50 w-52 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-[var(--border)]">
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search palette tokens..."
                className="w-full bg-[var(--surface-2)] rounded-lg px-2 py-1 text-xs text-[var(--foreground)] focus:outline-none placeholder:text-[var(--muted)]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.slice(0, 40).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onSelect(opt.value, opt.hex); setOpen(false); setQuery("") }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="w-4 h-4 rounded flex-shrink-0 border border-white/10" style={{ background: opt.hex }} />
                  <span className="text-xs text-[var(--foreground)] flex-1 text-left font-mono">{opt.value}</span>
                  <span className="text-[10px] text-[var(--muted)]">{opt.hex}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-3 text-xs text-[var(--muted)] text-center">No matches</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Contrast badge ───────────────────────────────────────────────────────
function ContrastBadge({ fg, bg }: { fg: string; bg: string }) {
  const ratio = contrastRatio(fg, bg)
  const level = wcagLevel(ratio)
  const color = wcagLevelColor(level)
  return (
    <span
      className="text-[9px] font-bold px-1 py-0.5 rounded font-mono flex-shrink-0"
      style={{ background: color + "20", color }}
      title={`Contrast ratio: ${ratio}:1 — WCAG ${level}`}
    >
      {ratio.toFixed(1)}
    </span>
  )
}

// ─── Semantic row ─────────────────────────────────────────────────────────
function SemanticRow({ color, palettes }: { color: SemanticColor; palettes: ColorPalette[] }) {
  const { updateSemanticColor, removeSemanticColor } = useTokensStore()

  const resolvedLight = color.lightRef ? (resolveRef(color.lightRef, palettes) ?? color.lightValue) : color.lightValue
  const resolvedDark  = color.darkRef  ? (resolveRef(color.darkRef,  palettes) ?? color.darkValue)  : color.darkValue

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors group"
    >
      {/* Light swatch + alias */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-7 h-7 rounded-md overflow-hidden border border-white/10 flex-shrink-0"
          style={{ background: resolvedLight }}>
          <input type="color" value={resolvedLight}
            onChange={e => updateSemanticColor({ ...color, lightValue: e.target.value, lightRef: undefined })}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
        </div>
        <AliasPicker
          value={color.lightRef}
          palettes={palettes}
          onSelect={(ref, hex) => updateSemanticColor({ ...color, lightRef: ref, lightValue: hex })}
          onClear={() => updateSemanticColor({ ...color, lightRef: undefined })}
        />
      </div>

      {/* Dark swatch + alias */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-7 h-7 rounded-md overflow-hidden border border-white/10 flex-shrink-0 bg-zinc-900"
          style={{ background: resolvedDark }}>
          <input type="color" value={resolvedDark}
            onChange={e => updateSemanticColor({ ...color, darkValue: e.target.value, darkRef: undefined })}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
        </div>
        <AliasPicker
          value={color.darkRef}
          palettes={palettes}
          onSelect={(ref, hex) => updateSemanticColor({ ...color, darkRef: ref, darkValue: hex })}
          onClear={() => updateSemanticColor({ ...color, darkRef: undefined })}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--foreground)] truncate">{color.name}</span>
          <CopyBadge cssVar={`--color-${color.id}`} value={resolvedLight} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
        <div className="text-[10px] text-[var(--muted)] font-mono truncate">
          {color.lightRef ?? resolvedLight}
        </div>
      </div>

      {/* Contrast badges — white on color */}
      <div className="flex flex-col gap-0.5 items-end flex-shrink-0">
        <ContrastBadge fg="#ffffff" bg={resolvedLight} />
        <ContrastBadge fg="#ffffff" bg={resolvedDark} />
      </div>

      <Button variant="ghost" size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-400"
        onClick={() => removeSemanticColor(color.id)}>
        <Trash2 size={13} />
      </Button>
    </motion.div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────
export function ColorsPanel({ filter = "" }: { filter?: string }) {
  const { tokens, addColorPalette, addSemanticColor } = useTokensStore()
  const [activeTab, setActiveTab] = useState<"palettes" | "semantic">("palettes")
  const q = filter.toLowerCase()
  const visiblePalettes = tokens.colors.palettes.filter(p => !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
  const visibleSemantic = tokens.colors.semantic.filter(c => !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.lightValue.includes(q) || c.darkValue.includes(q))

  const handleAddPalette = () => {
    addColorPalette({
      id: `palette-${Date.now()}`,
      name: "New Palette",
      shades: generateShades("#6366f1") as ColorPalette["shades"],
    })
  }

  const handleAddSemantic = () => {
    addSemanticColor({
      id: `semantic-${Date.now()}`,
      name: "New Color",
      lightValue: "#6366f1",
      darkValue: "#818cf8",
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-[var(--surface-2)] rounded-lg">
        {(["palettes", "semantic"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="relative flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-colors"
            style={{ color: activeTab === tab ? "var(--foreground)" : "var(--muted)" }}
          >
            {activeTab === tab && (
              <motion.div layoutId="color-tab"
                className="absolute inset-0 bg-[var(--surface-3)] rounded-md" />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "palettes" ? (
          <motion.div key="palettes" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-2">
            <AnimatePresence>
              {visiblePalettes.map(palette => <PaletteRow key={palette.id} palette={palette} />)}
            </AnimatePresence>
            <Button variant="ghost" size="sm" onClick={handleAddPalette} className="mt-1 w-full justify-start gap-2 text-[var(--muted)]">
              <Plus size={13} /> Add palette
            </Button>
          </motion.div>
        ) : (
          <motion.div key="semantic" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="flex flex-col gap-1">
            {/* Legend */}
            <div className="flex items-center gap-2 px-3 mb-1">
              <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider w-7 text-center">Light</span>
              <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider w-7 text-center">Dark</span>
              <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider flex-1">Token</span>
              <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider text-right">Contrast</span>
            </div>
            <AnimatePresence>
              {visibleSemantic.map(color => (
                <SemanticRow key={color.id} color={color} palettes={tokens.colors.palettes} />
              ))}
            </AnimatePresence>
            <Button variant="ghost" size="sm" onClick={handleAddSemantic} className="mt-1 w-full justify-start gap-2 text-[var(--muted)]">
              <Plus size={13} /> Add semantic color
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
