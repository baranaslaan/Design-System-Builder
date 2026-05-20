"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, ArrowRight, Palette, Type, Space, Circle, Minus, BoxSelect, Blend, CornerDownLeft, Zap, Droplets, Monitor, Layers, CircleDashed } from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { buildSearchIndex, searchTokens } from "@/lib/search"
import type { TokenCategory } from "@/types/tokens"
import type { SearchResult } from "@/lib/search"

const CATEGORY_ICONS: Record<TokenCategory, React.ReactNode> = {
  colors:     <Palette size={11} />,
  typography: <Type size={11} />,
  spacing:    <Space size={11} />,
  radius:     <Circle size={11} />,
  stroke:     <Minus size={11} />,
  shadow:     <BoxSelect size={11} />,
  gradient:   <Blend size={11} />,
  motion:     <Zap size={11} />,
  opacity:    <Droplets size={11} />,
  breakpoint: <Monitor size={11} />,
  zindex:     <Layers size={11} />,
  blur:       <CircleDashed size={11} />,
}

const CATEGORY_LABELS: Record<TokenCategory, string> = {
  colors:     "Colors",
  typography: "Typography",
  spacing:    "Spacing",
  radius:     "Radius",
  stroke:     "Stroke",
  shadow:     "Shadows",
  gradient:   "Gradients",
  motion:     "Motion",
  opacity:    "Opacity",
  breakpoint: "Breakpoints",
  zindex:     "Z-Index",
  blur:       "Blur",
}

const ALL_CATEGORIES: TokenCategory[] = ["colors", "typography", "spacing", "radius", "stroke", "shadow", "gradient", "motion", "opacity", "breakpoint", "zindex", "blur"]

interface TokenSearchProps {
  open: boolean
  onClose: () => void
}

export function TokenSearch({ open, onClose }: TokenSearchProps) {
  const { tokens, setActiveCategory } = useTokensStore()
  const [query, setQuery] = useState("")
  const [catFilter, setCatFilter] = useState<TokenCategory | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  const index   = useMemo(() => buildSearchIndex(tokens), [tokens])
  const results = useMemo(() => searchTokens(index, query, catFilter), [index, query, catFilter])

  useEffect(() => {
    if (open) {
      setQuery("")
      setCatFilter(null)
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => { setActiveIdx(0) }, [results.length])

  const handleSelect = useCallback(
    (result: SearchResult) => { setActiveCategory(result.category); onClose() },
    [setActiveCategory, onClose],
  )

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     { onClose(); return }
      if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
      if (e.key === "ArrowUp")    { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
      if (e.key === "Enter" && results[activeIdx]) handleSelect(results[activeIdx])
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, results, activeIdx, handleSelect, onClose])

  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [activeIdx])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.95, y: -16 }}
            transition={{ type: "spring", stiffness: 480, damping: 40 }}
            className="fixed top-[12%] left-1/2 -translate-x-1/2 z-50 w-full max-w-[560px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* ── Search input ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
              <Search size={15} className="text-[var(--muted)] flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search tokens… color, spacing, shadow…"
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setQuery("")}
                    className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <X size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
              <kbd className="flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted)] bg-[var(--surface-2)] rounded border border-[var(--border)]">
                ESC
              </kbd>
            </div>

            {/* ── Category filter pills ─────────────────────────────── */}
            <div className="flex gap-1.5 px-3 py-2.5 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
              <FilterPill label="All" active={catFilter === null} onClick={() => setCatFilter(null)} />
              {ALL_CATEGORIES.map(cat => (
                <FilterPill
                  key={cat}
                  label={CATEGORY_LABELS[cat]}
                  icon={CATEGORY_ICONS[cat]}
                  active={catFilter === cat}
                  onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                />
              ))}
            </div>

            {/* ── Results list ─────────────────────────────────────── */}
            <div ref={listRef} className="max-h-[320px] overflow-y-auto">
              <AnimatePresence mode="wait">
                {results.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="py-10 text-center"
                  >
                    <p className="text-sm text-[var(--muted)]">No tokens found</p>
                    <p className="text-xs text-[var(--muted)] mt-1 opacity-50">Try a different search term or category</p>
                  </motion.div>
                ) : (
                  <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {results.map((result, i) => (
                      <ResultRow
                        key={result.id}
                        result={result}
                        active={i === activeIdx}
                        onMouseEnter={() => setActiveIdx(i)}
                        onSelect={() => handleSelect(result)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-2)]">
              <span className="text-[10px] text-[var(--muted)]">
                {results.length} token{results.length !== 1 ? "s" : ""}
                {query && ` matching "${query}"`}
              </span>
              <div className="flex items-center gap-3 text-[10px] text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-[var(--surface-3)] px-1 rounded">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft size={10} /> go to category
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function FilterPill({
  label, icon, active, onClick,
}: {
  label: string
  icon?: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
      style={{
        background: active ? "var(--accent)"   : "var(--surface-2)",
        color:      active ? "#fff"            : "var(--muted)",
        border:     `1px solid ${active ? "var(--accent)" : "transparent"}`,
      }}
    >
      {icon}
      {label}
    </motion.button>
  )
}

function ResultRow({
  result, active, onMouseEnter, onSelect,
}: {
  result: SearchResult
  active: boolean
  onMouseEnter: () => void
  onSelect: () => void
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onClick={onSelect}
      className="flex items-center gap-3 w-full px-4 py-2.5 transition-colors text-left group"
      style={{ background: active ? "var(--surface-2)" : "transparent" }}
    >
      {/* Swatch or icon */}
      {result.colorValue ? (
        <div
          className="w-5 h-5 rounded-md flex-shrink-0 border border-white/10 shadow-sm"
          style={{ background: result.colorValue }}
        />
      ) : (
        <div
          className="w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-md"
          style={{ background: "var(--surface-3)", color: "var(--muted)" }}
        >
          {CATEGORY_ICONS[result.category]}
        </div>
      )}

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--foreground)] truncate">{result.label}</div>
        <div className="text-[10px] text-[var(--muted)] truncate">{result.subLabel}</div>
      </div>

      {/* Value */}
      <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--surface-3)] px-1.5 py-0.5 rounded truncate max-w-[160px] flex-shrink-0">
        {result.value.length > 24 ? result.value.slice(0, 24) + "…" : result.value}
      </span>

      {/* Arrow on active */}
      <motion.div
        animate={{ opacity: active ? 1 : 0, x: active ? 0 : -4 }}
        transition={{ duration: 0.1 }}
        className="flex-shrink-0"
      >
        <ArrowRight size={12} className="text-[var(--accent)]" />
      </motion.div>
    </button>
  )
}
