"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, X, Download } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { useTokensStore } from "@/store/tokens"
import {
  exportToCSSVariables, exportToFigmaTokens,
  exportToSCSS, exportToTailwind, exportToStyleDictionary,
  exportSectionToCSS, exportSectionToSCSS,
  tokenStats,
} from "@/lib/exporters"
import type { ExportSection } from "@/lib/exporters"
import { Button } from "@/components/ui/button"
import { copyToClipboard } from "@/lib/utils"

interface ExportModalProps { open: boolean; onClose: () => void }

type ExportFormat = "css" | "scss" | "tailwind" | "style-dictionary" | "figma"

const FORMATS: { key: ExportFormat; label: string; ext: string; desc: string; lang: "css" | "scss" | "js" | "json" }[] = [
  { key: "css",              label: "CSS Variables",    ext: "tokens.css",         desc: ":root custom properties", lang: "css"  },
  { key: "scss",             label: "SCSS",             ext: "_tokens.scss",       desc: "$variable format",        lang: "scss" },
  { key: "tailwind",         label: "Tailwind",         ext: "tailwind.config.js", desc: "theme.extend config",     lang: "js"   },
  { key: "style-dictionary", label: "Style Dictionary", ext: "tokens.sd.json",     desc: "amazon/style-dictionary", lang: "json" },
  { key: "figma",            label: "Figma Tokens",     ext: "tokens.json",        desc: "Figma Tokens plugin",     lang: "json" },
]

const SECTIONS: { key: ExportSection; label: string }[] = [
  { key: "all",        label: "All"        },
  { key: "colors",     label: "Colors"     },
  { key: "typography", label: "Typography" },
  { key: "spacing",    label: "Spacing"    },
  { key: "radius",     label: "Radius"     },
  { key: "stroke",     label: "Stroke"     },
  { key: "shadows",    label: "Shadows"    },
  { key: "gradients",  label: "Gradients"  },
]

// ── Syntax highlighter ────────────────────────────────────────────────────
function highlight(code: string, lang: "css" | "scss" | "js" | "json"): React.ReactNode[] {
  const lines = code.split("\n")
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = []

    if (lang === "css" || lang === "scss") {
      // Comment
      if (/^\s*(\/\*|\/\/)/.test(line)) {
        parts.push(<span key="c" style={{ color: "var(--muted)", opacity: 0.5 }}>{line}</span>)
      } else if (line.includes(":") && (line.includes("--") || line.includes("$"))) {
        // variable: value
        const [prop, ...rest] = line.split(":")
        const value = rest.join(":").replace(";", "").trim()
        const isVar = prop.trim().startsWith("--") || prop.trim().startsWith("$")
        parts.push(
          <span key="p" style={{ color: isVar ? "#a78bfa" : "var(--foreground)" }}>{prop}</span>,
          <span key="col" style={{ color: "var(--muted)" }}>:</span>,
          <span key="v" style={{ color: "#34d399" }}> {value}</span>,
          <span key="s" style={{ color: "var(--muted)" }}>;</span>,
        )
      } else if (/^\s*[.:#\[]|^:root|^\.dark/.test(line)) {
        parts.push(<span key="sel" style={{ color: "#60a5fa" }}>{line}</span>)
      } else {
        parts.push(<span key="d">{line}</span>)
      }
    } else if (lang === "json") {
      if (/^\s*"[^"]+"\s*:/.test(line)) {
        const match = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)$/)
        if (match) {
          parts.push(
            <span key="ws">{match[1]}</span>,
            <span key="k" style={{ color: "#a78bfa" }}>"{match[2]}"</span>,
            <span key="col" style={{ color: "var(--muted)" }}>{match[3]}</span>,
            <span key="v" style={{ color: "#34d399" }}>{match[4]}</span>,
          )
        } else parts.push(<span key="d">{line}</span>)
      } else {
        parts.push(<span key="d" style={{ color: "var(--muted)" }}>{line}</span>)
      }
    } else if (lang === "js") {
      if (/^\s*\/\//.test(line)) {
        parts.push(<span key="c" style={{ color: "var(--muted)", opacity: 0.5 }}>{line}</span>)
      } else if (/^\s*\w+:/.test(line)) {
        const match = line.match(/^(\s*)(\w+)(\s*:\s*)(.*)$/)
        if (match) {
          parts.push(
            <span key="ws">{match[1]}</span>,
            <span key="k" style={{ color: "#a78bfa" }}>{match[2]}</span>,
            <span key="col" style={{ color: "var(--muted)" }}>{match[3]}</span>,
            <span key="v" style={{ color: "#34d399" }}>{match[4]}</span>,
          )
        } else parts.push(<span key="d">{line}</span>)
      } else if (/\b(module\.exports|const|let|var)\b/.test(line)) {
        parts.push(<span key="kw" style={{ color: "#60a5fa" }}>{line}</span>)
      } else {
        parts.push(<span key="d">{line}</span>)
      }
    } else {
      parts.push(<span key="d">{line}</span>)
    }

    return (
      <div key={i} className="flex">
        <span className="select-none w-9 text-right pr-3 flex-shrink-0" style={{ color: "var(--muted)", opacity: 0.3, userSelect: "none" }}>
          {i + 1}
        </span>
        <span className="flex-1">{parts}</span>
      </div>
    )
  })
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { tokens } = useTokensStore()
  const [format, setFormat] = useState<ExportFormat>("css")
  const [section, setSection] = useState<ExportSection>("all")
  const [copied, setCopied] = useState(false)

  const meta = FORMATS.find(f => f.key === format)!
  const sectionSupported = format === "css" || format === "scss"
  const activeSection = sectionSupported ? section : "all"

  const output = useMemo(() => {
    if (format === "css")              return exportSectionToCSS(tokens, activeSection)
    if (format === "scss")             return exportSectionToSCSS(tokens, activeSection)
    if (format === "tailwind")         return exportToTailwind(tokens)
    if (format === "style-dictionary") return exportToStyleDictionary(tokens)
    return exportToFigmaTokens(tokens)
  }, [format, tokens, activeSection])

  const stats = useMemo(() => tokenStats(tokens), [tokens])
  const highlighted = useMemo(() => highlight(output, meta.lang), [output, meta.lang])

  const handleCopy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = meta.ext; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAll = () => {
    const allFormats: [ExportFormat, string, string][] = [
      ["css",              exportToCSSVariables(tokens),        "tokens.css"],
      ["scss",             exportToSCSS(tokens),                "_tokens.scss"],
      ["tailwind",         exportToTailwind(tokens),            "tailwind.config.js"],
      ["style-dictionary", exportToStyleDictionary(tokens),     "tokens.sd.json"],
      ["figma",            exportToFigmaTokens(tokens),         "tokens.json"],
    ]
    allFormats.forEach(([, content, filename], i) => {
      setTimeout(() => {
        const blob = new Blob([content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url; a.download = filename; a.click()
        URL.revokeObjectURL(url)
      }, i * 200)
    })
  }

  const lineCount = output.split("\n").length

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div>
                <Dialog.Title className="text-base font-semibold text-[var(--foreground)]">Export Tokens</Dialog.Title>
                <Dialog.Description asChild>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-[var(--muted)]">{tokens.name}</span>
                    <div className="flex items-center gap-2">
                      {[
                        ["Colors",     stats.colors],
                        ["Type",       stats.typography],
                        ["Spacing",    stats.spacing],
                        ["Shadows",    stats.shadows],
                        ["Gradients",  stats.gradients],
                      ].map(([label, count]) => (count as number) > 0 && (
                        <span key={label as string} className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                          style={{ background: "var(--surface-3)", color: "var(--muted)" }}>
                          {label} {count}
                        </span>
                      ))}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                        style={{ background: "var(--accent-muted)", color: "#a78bfa" }}>
                        {stats.total()} total
                      </span>
                    </div>
                  </div>
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0 ml-4"><X size={16} /></Button>
              </Dialog.Close>
            </div>

            {/* Format tabs */}
            <div className="flex gap-1 px-6 pt-3 overflow-x-auto no-scrollbar flex-shrink-0">
              {FORMATS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFormat(f.key)}
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-xs transition-all text-left"
                  style={{
                    background: format === f.key ? "var(--surface-2)" : "transparent",
                    color: format === f.key ? "var(--foreground)" : "var(--muted)",
                    border: `1px solid ${format === f.key ? "var(--border)" : "transparent"}`,
                  }}
                >
                  <div className="font-semibold">{f.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>

            {/* Section filter (CSS/SCSS only) */}
            <AnimatePresence>
              {sectionSupported && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-1 px-6 pt-2 pb-1 overflow-x-auto no-scrollbar flex-shrink-0"
                >
                  {SECTIONS.map(s => (
                    <button
                      key={s.key}
                      onClick={() => setSection(s.key)}
                      className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                      style={{
                        background: section === s.key ? "var(--accent)" : "var(--surface-2)",
                        color:      section === s.key ? "#fff"         : "var(--muted)",
                        border:     `1px solid ${section === s.key ? "var(--accent)" : "transparent"}`,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Code output */}
            <div className="relative mx-6 my-3 rounded-xl overflow-hidden border border-[var(--border)] flex flex-col min-h-0 flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-2)] border-b border-[var(--border)] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--muted)]">{meta.ext}</span>
                  <span className="text-[10px] text-[var(--muted)] opacity-50">{lineCount} lines</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="ghost" onClick={handleDownload} className="gap-1.5 text-[var(--muted)] text-xs">
                    <Download size={12} /> Download
                  </Button>
                  <Button size="sm" variant={copied ? "accent" : "ghost"} onClick={handleCopy} className="gap-1.5 text-xs">
                    <AnimatePresence mode="wait">
                      {copied
                        ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5"><Check size={12} /> Copied!</motion.span>
                        : <motion.span key="copy"  className="flex items-center gap-1.5"><Copy size={12} /> Copy</motion.span>
                      }
                    </AnimatePresence>
                  </Button>
                </div>
              </div>

              {/* Highlighted code */}
              <div className="overflow-auto flex-1 bg-[var(--surface)]">
                <pre className="p-4 text-xs font-mono leading-[1.7] min-w-max">
                  {highlighted}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 pb-4 flex-shrink-0 gap-3">
              {/* Format hints */}
              <div className="flex-1">
                {format === "figma" && (
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Copy JSON → Figma → Install <strong className="text-[var(--foreground)]">Figma Tokens</strong> plugin → Paste → Apply.
                  </p>
                )}
                {format === "tailwind" && (
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Merge into your <code className="bg-[var(--surface-3)] px-1 rounded text-[10px]">tailwind.config.js</code> under <code className="bg-[var(--surface-3)] px-1 rounded text-[10px]">theme.extend</code>.
                  </p>
                )}
                {format === "style-dictionary" && (
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Save as <code className="bg-[var(--surface-3)] px-1 rounded text-[10px]">tokens/tokens.json</code> then run <code className="bg-[var(--surface-3)] px-1 rounded text-[10px]">style-dictionary build</code>.
                  </p>
                )}
                {(format === "css" || format === "scss") && (
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    {format === "css" ? "Import in your global CSS entry file." : "Import in your SCSS entry file with @use or @import."}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleDownloadAll} className="gap-1.5 text-[var(--muted)] flex-shrink-0 text-xs">
                <Download size={12} /> Download all formats
              </Button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
