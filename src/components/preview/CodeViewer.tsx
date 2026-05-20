"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Check, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { copyToClipboard } from "@/lib/utils"
import type { ComponentCodeSpec, CodeFormat } from "@/lib/componentCode"

const FORMATS: { key: CodeFormat; label: string; lang: string }[] = [
  { key: "react-tailwind", label: "React + Tailwind", lang: "jsx" },
  { key: "html-css",       label: "HTML + CSS",       lang: "html" },
  { key: "jsx-style",      label: "React + Style",    lang: "jsx" },
]

/** Lightweight token highlighter — mirrors the ExportModal style */
function highlight(code: string, lang: string): React.ReactNode[] {
  const lines = code.split("\n")
  return lines.map((line, idx) => {
    // Token coloring patterns
    let out: React.ReactNode = line

    // CSS variables — purple
    out = (out as string).replace(/var\(--[a-z0-9-]+\)/g, (m) => `§§VAR§§${m}§§/VAR§§`)
    // Strings — green
    out = (out as string).replace(/"([^"]*)"/g, (m) => `§§STR§§${m}§§/STR§§`)
    // JSX tags — cyan
    if (lang === "jsx" || lang === "html") {
      out = (out as string).replace(/<\/?[a-zA-Z][a-zA-Z0-9]*/g, (m) => `§§TAG§§${m}§§/TAG§§`)
    }
    // Numbers — orange
    out = (out as string).replace(/\b(\d+\.?\d*)(px|rem|em|%)?/g, (m) => `§§NUM§§${m}§§/NUM§§`)
    // Comments — muted
    out = (out as string).replace(/\/\*.*?\*\/|\/\/.*$/g, (m) => `§§CMT§§${m}§§/CMT§§`)

    // Parse markers into spans
    const parts = (out as string).split(/§§(\/?[A-Z]+)§§/)
    const nodes: React.ReactNode[] = []
    let curMode: string | null = null
    for (const part of parts) {
      if (!part) continue
      if (/^[A-Z]+$/.test(part) && !part.startsWith("/")) {
        curMode = part
        continue
      }
      if (part.startsWith("/") && /^\/[A-Z]+$/.test(part)) {
        curMode = null
        continue
      }
      const color =
        curMode === "VAR" ? "#a78bfa" :
        curMode === "STR" ? "#10b981" :
        curMode === "TAG" ? "#22d3ee" :
        curMode === "NUM" ? "#f59e0b" :
        curMode === "CMT" ? "#71717a" :
        undefined
      nodes.push(color ? <span key={nodes.length} style={{ color }}>{part}</span> : part)
    }

    return (
      <div key={idx} className="flex">
        <span className="select-none text-[var(--muted)] opacity-40 font-mono text-[10px] w-7 text-right pr-2 flex-shrink-0">
          {idx + 1}
        </span>
        <span className="flex-1 whitespace-pre">{nodes}</span>
      </div>
    )
  })
}

interface CodeViewerProps {
  open: boolean
  spec: ComponentCodeSpec | null
  onClose: () => void
}

export function CodeViewer({ open, spec, onClose }: CodeViewerProps) {
  const [format, setFormat] = useState<CodeFormat>("react-tailwind")
  const [copied, setCopied] = useState(false)

  const code = spec?.formats[format] ?? ""
  const highlighted = useMemo(() => {
    const lang = FORMATS.find((f) => f.key === format)?.lang ?? "jsx"
    return highlight(code, lang)
  }, [code, format])

  const handleCopy = async () => {
    await copyToClipboard(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <AnimatePresence>
      {open && spec && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-4 top-8 bottom-8 z-50 max-w-3xl mx-auto flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center">
                <Code2 size={16} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[var(--foreground)]">{spec.name}</div>
                <div className="text-[11px] text-[var(--muted)]">Uses your token CSS variables</div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close">
                <X size={14} />
              </Button>
            </div>

            {/* Format tabs + copy */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex items-center gap-1">
                {FORMATS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className="relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    style={{ color: format === f.key ? "var(--foreground)" : "var(--muted)" }}
                  >
                    {format === f.key && (
                      <motion.div
                        layoutId="code-format-tab"
                        className="absolute inset-0 bg-[var(--surface-2)] rounded-md"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{f.label}</span>
                  </button>
                ))}
              </div>
              <Button size="sm" variant="ghost" onClick={handleCopy} className="ml-auto gap-1.5">
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </Button>
            </div>

            {/* Code */}
            <div className="flex-1 overflow-y-auto bg-[var(--background)]">
              <div className="font-mono text-[12px] leading-relaxed p-4 text-[var(--foreground)]">
                {highlighted}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
