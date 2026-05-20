"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Layers, ChevronDown, Upload, Download, Plus, Trash2,
  Check, Edit2, X, BookmarkPlus, FileJson,
} from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { Button } from "@/components/ui/button"
import { PRESETS } from "@/data/presets"
import type { DesignTokens } from "@/types/tokens"

const PRESET_META: Record<string, { label: string; description: string; color: string }> = {
  default:   { label: "Default System", description: "Violet-based modern system",  color: "#7c3aed" },
  material:  { label: "Material 3",     description: "Google Material Design 3",    color: "#6750a4" },
  tailwind:  { label: "Tailwind CSS",   description: "Official Tailwind defaults",  color: "#06b6d4" },
  fluent:    { label: "Fluent 2",       description: "Microsoft design system",     color: "#115ea3" },
  ant:       { label: "Ant Design",     description: "Alibaba enterprise system",   color: "#1677ff" },
  carbon:    { label: "IBM Carbon",     description: "IBM open-source system",      color: "#0f62fe" },
  bootstrap: { label: "Bootstrap 5",    description: "Classic web framework",       color: "#0d6efd" },
}

export function PresetLoader() {
  const {
    tokens, activePreset,
    loadPreset, importJSON,
    saveCurrentAsPreset, loadCustomPreset, deleteCustomPreset, renameCustomPreset,
    customPresets,
  } = useTokensStore()

  const [open, setOpen] = useState(false)
  const [savingName, setSavingName] = useState("")
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const close = () => { setOpen(false); setShowSaveInput(false); setSavingName("") }

  // ── Save current ──────────────────────────────────────────────
  const handleSave = () => {
    const name = savingName.trim() || tokens.name
    saveCurrentAsPreset(name)
    setSavingName("")
    setShowSaveInput(false)
  }

  // ── File import ───────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      try {
        const parsed = JSON.parse(text) as DesignTokens
        if (parsed.colors && parsed.typography) {
          importJSON(text)
          close()
        }
      } catch { /* invalid JSON */ }
    }
    reader.readAsText(file)
  }, [importJSON])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith(".json")) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ""
  }

  // ── Export current tokens as raw JSON ─────────────────────────
  const handleExport = () => {
    const json = JSON.stringify(tokens, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${tokens.name.toLowerCase().replace(/\s+/g, "-")}.tokens.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const currentLabel =
    PRESET_META[activePreset]?.label ??
    customPresets.find(p => p.id === activePreset)?.name ??
    "Custom"

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2 text-[var(--muted-foreground)]"
      >
        <Layers size={13} />
        <span className="hidden sm:inline max-w-[120px] truncate">{currentLabel}</span>
        <ChevronDown size={11} className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={close} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 mr-1 z-30 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* ── Built-in presets ─────────────────────────── */}
              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">Built-in</p>
              </div>
              {Object.entries(PRESET_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => { loadPreset(key); close() }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: meta.color }} />
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--foreground)] truncate">{meta.label}</div>
                    <div className="text-xs text-[var(--muted)] truncate">{meta.description}</div>
                  </div>
                  {activePreset === key && <div className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />}
                </button>
              ))}

              {/* ── Custom presets ───────────────────────────── */}
              {customPresets.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1 border-t border-[var(--border)]">
                    <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">My Presets</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <AnimatePresence>
                      {customPresets.map((preset) => (
                        <motion.div
                          key={preset.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8, height: 0 }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-2)] transition-colors group"
                        >
                          {renamingId === preset.id ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                autoFocus
                                value={renameVal}
                                onChange={e => setRenameVal(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") { renameCustomPreset(preset.id, renameVal); setRenamingId(null) }
                                  if (e.key === "Escape") setRenamingId(null)
                                }}
                                className="flex-1 bg-[var(--surface-3)] border border-[var(--accent)] rounded-md px-2 py-1 text-xs text-[var(--foreground)] focus:outline-none"
                              />
                              <button onClick={() => { renameCustomPreset(preset.id, renameVal); setRenamingId(null) }}
                                className="text-[var(--accent)]"><Check size={12} /></button>
                              <button onClick={() => setRenamingId(null)}
                                className="text-[var(--muted)]"><X size={12} /></button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => { loadCustomPreset(preset.id); close() }}
                                className="flex-1 text-left flex items-center gap-2.5 min-w-0"
                              >
                                <div
                                  className="w-6 h-6 rounded-lg flex-shrink-0 border border-white/10 flex items-center justify-center"
                                  style={{
                                    background: preset.tokens.colors.semantic[0]?.lightValue ?? "#7c3aed",
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-[var(--foreground)] truncate">{preset.name}</div>
                                  <div className="text-[10px] text-[var(--muted)]">
                                    {new Date(preset.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </button>
                              {activePreset === preset.id && <div className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setRenamingId(preset.id); setRenameVal(preset.name) }}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  onClick={() => deleteCustomPreset(preset.id)}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* ── Actions ──────────────────────────────────── */}
              <div className="border-t border-[var(--border)] p-3 flex flex-col gap-2">
                {/* Save current */}
                <AnimatePresence mode="wait">
                  {showSaveInput ? (
                    <motion.div
                      key="save-input"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-2"
                    >
                      <input
                        autoFocus
                        value={savingName}
                        onChange={e => setSavingName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setShowSaveInput(false) }}
                        placeholder={tokens.name}
                        className="w-full bg-[var(--surface-2)] border border-[var(--accent)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none placeholder:text-[var(--muted)]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="accent" onClick={handleSave} className="flex-1 gap-1.5">
                          <Check size={12} /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowSaveInput(false)}>Cancel</Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="save-btn"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setShowSaveInput(true)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <BookmarkPlus size={13} />
                      Save current as preset
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Import / Export row */}
                <div className="flex gap-2">
                  {/* File import */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className="flex-1"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-xs transition-colors border"
                      style={{
                        borderColor: dragOver ? "var(--accent)" : "var(--border)",
                        background: dragOver ? "var(--accent-muted)" : "transparent",
                        color: dragOver ? "var(--accent)" : "var(--muted)",
                      }}
                    >
                      <Upload size={12} />
                      Import .json
                    </button>
                  </div>

                  {/* Export */}
                  <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-1.5 flex-1 px-2 py-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors border border-[var(--border)]"
                  >
                    <FileJson size={12} />
                    Export .json
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
