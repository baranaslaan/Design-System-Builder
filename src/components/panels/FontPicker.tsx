"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Check, ChevronDown, X } from "lucide-react"
import { GOOGLE_FONTS, type FontCategory } from "@/data/googleFonts"
import { loadGoogleFont } from "@/lib/fontLoader"

const CATEGORY_LABELS: Record<FontCategory | "all", string> = {
  all: "All",
  "sans-serif": "Sans",
  serif: "Serif",
  monospace: "Mono",
  display: "Display",
}

const PREVIEW_TEXT = "The quick brown fox"

interface FontPickerProps {
  value: string
  onChange: (fontFamily: string) => void
  label: string
}

export function FontPicker({ value, onChange, label }: FontPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [catFilter, setCatFilter] = useState<FontCategory | "all">("all")
  const [previewLoaded, setPreviewLoaded] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const currentFontName = useMemo(() => {
    const m = value.match(/^["']?([^,"']+)["']?/)
    return m ? m[1].trim() : value
  }, [value])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return GOOGLE_FONTS.filter(f =>
      (catFilter === "all" || f.category === catFilter) &&
      (!q || f.name.toLowerCase().includes(q))
    )
  }, [query, catFilter])

  // Load previews for visible fonts
  useEffect(() => {
    if (!open) return
    const toLoad = filtered.slice(0, 30)
    toLoad.forEach(f => {
      if (!previewLoaded.has(f.name)) {
        loadGoogleFont(f.name, f.weights ?? "400;700")
        setPreviewLoaded(prev => new Set([...prev, f.name]))
      }
    })
  }, [filtered, open])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  const handleSelect = (fontName: string, weights?: string) => {
    loadGoogleFont(fontName, weights ?? "300;400;500;600;700")
    const fallback = GOOGLE_FONTS.find(f => f.name === fontName)?.category === "serif"
      ? "Georgia, serif"
      : GOOGLE_FONTS.find(f => f.name === fontName)?.category === "monospace"
        ? "monospace"
        : "system-ui, sans-serif"
    onChange(`"${fontName}", ${fallback}`)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Trigger */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-left hover:border-[var(--accent)] transition-colors group"
      >
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium text-[var(--foreground)] truncate"
            style={{ fontFamily: value }}
          >
            {PREVIEW_TEXT}
          </div>
          <div className="text-[10px] text-[var(--muted)] font-mono truncate mt-0.5">{currentFontName}</div>
        </div>
        <ChevronDown
          size={13}
          className="text-[var(--muted)] flex-shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxWidth: "320px" }}
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
              <Search size={13} className="text-[var(--muted)] flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search fonts…"
                className="flex-1 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-1 px-2.5 py-2 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
              {(["all", "sans-serif", "serif", "monospace", "display"] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all"
                  style={{
                    background: catFilter === cat ? "var(--accent)" : "var(--surface-2)",
                    color: catFilter === cat ? "#fff" : "var(--muted)",
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Font list */}
            <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-[var(--muted)]">No fonts found</div>
              ) : (
                filtered.slice(0, 50).map(font => (
                  <FontRow
                    key={font.name}
                    font={font}
                    active={currentFontName === font.name}
                    loaded={previewLoaded.has(font.name)}
                    onSelect={() => handleSelect(font.name, font.weights)}
                  />
                ))
              )}
            </div>

            {/* Footer count */}
            <div className="px-3 py-1.5 border-t border-[var(--border)] bg-[var(--surface-2)]">
              <span className="text-[10px] text-[var(--muted)]">{filtered.length} fonts</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FontRow({
  font, active, loaded, onSelect,
}: {
  font: (typeof GOOGLE_FONTS)[0]
  active: boolean
  loaded: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[var(--surface-2)] transition-colors text-left"
      style={{ background: active ? "var(--surface-2)" : "transparent" }}
    >
      <div className="flex-1 min-w-0">
        {loaded ? (
          <span
            className="text-sm text-[var(--foreground)] block truncate"
            style={{ fontFamily: `"${font.name}"` }}
          >
            {PREVIEW_TEXT}
          </span>
        ) : (
          <span className="text-sm text-[var(--muted)] block truncate">{font.name}</span>
        )}
        <span className="text-[10px] text-[var(--muted)] mt-0.5 block">{font.name}</span>
      </div>
      {active && <Check size={12} className="text-[var(--accent)] flex-shrink-0" />}
    </button>
  )
}
