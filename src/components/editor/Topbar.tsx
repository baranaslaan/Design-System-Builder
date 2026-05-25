"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Download, Sparkles, Edit2, Check, Search, Undo2, Redo2, BarChart3, ShieldCheck, Gauge, Layers, GraduationCap, Box } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useTokensStore } from "@/store/tokens"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import { PresetLoader } from "./PresetLoader"
import { ExportModal } from "./ExportModal"
import { ProfileDropdown } from "@/components/auth/ProfileDropdown"
import { useT } from "@/lib/i18n"

interface TopbarProps { onSearchOpen?: () => void; onHelpOpen?: () => void }

export function Topbar({ onSearchOpen, onHelpOpen: _onHelpOpen }: TopbarProps) {
  const t = useT()
  const { tokens, updateName, undoStack, redoStack, undo, redo, appTheme } = useTokensStore()
  const [exportOpen, setExportOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(tokens.name)

  useEffect(() => {
    document.documentElement.dataset.theme = appTheme
  }, [appTheme])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redo() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo])

  const handleNameSave = () => {
    if (nameVal.trim()) updateName(nameVal.trim())
    setEditingName(false)
  }

  const displayName = editingName ? nameVal : tokens.name

  return (
    <>
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)] flex-shrink-0 relative z-30">
        {/* Logo mark */}
        <div className="flex items-center gap-2.5 mr-1">
          <motion.div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
            whileHover={{ scale: 1.08 }}
          >
            <Sparkles size={13} color="white" />
          </motion.div>
          <span className="text-sm font-bold text-[var(--foreground)] hidden sm:block">{t("app_name")}</span>
        </div>

        <div className="h-5 w-px bg-[var(--border)]" />

        {/* System name */}
        <div className="flex items-center gap-1.5 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-1.5">
              <input
                className="bg-[var(--surface-2)] border border-[var(--accent)] rounded-md px-2 py-0.5 text-sm font-medium text-[var(--foreground)] focus:outline-none w-40"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(); if (e.key === "Escape") setEditingName(false) }}
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleNameSave}>
                <Check size={12} />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setNameVal(tokens.name); setEditingName(true) }}
              className="flex items-center gap-1.5 hover:text-[var(--foreground)] text-[var(--muted-foreground)] transition-colors group text-sm font-medium"
            >
              {displayName}
              <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Centered search bar — pinned to viewport center, not flex layout */}
        <motion.button
          onClick={onSearchOpen}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2.5 h-8 px-3 w-[300px] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg transition-colors text-[var(--muted)] hover:text-[var(--foreground)] group"
        >
          <Search size={13} className="flex-shrink-0 group-hover:text-[var(--accent)] transition-colors" />
          <span className="text-xs flex-1 text-left">{t("search_placeholder")}</span>
          <kbd className="text-[9px] font-mono bg-[var(--background)] border border-[var(--border)] px-1.5 py-0.5 rounded flex-shrink-0">{t("search_kbd")}</kbd>
        </motion.button>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <Tooltip content={t("tooltip_undo")} side="bottom">
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={undoStack.length === 0}
                className="h-8 w-8 disabled:opacity-30"
                aria-label={t("tooltip_undo")}
              >
                <Undo2 size={14} />
              </Button>
            </Tooltip>
            <Tooltip content={t("tooltip_redo")} side="bottom">
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={redoStack.length === 0}
                className="h-8 w-8 disabled:opacity-30"
                aria-label={t("tooltip_redo")}
              >
                <Redo2 size={14} />
              </Button>
            </Tooltip>
          </div>

          <div className="h-4 w-px bg-[var(--border)]" />

          <Tooltip content="Adoption Analytics" side="bottom">
            <Link href="/adoption">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Adoption Analytics">
                <BarChart3 size={14} />
              </Button>
            </Link>
          </Tooltip>
          <Tooltip content="Consistency Audit" side="bottom">
            <Link href="/audit">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Consistency Audit">
                <ShieldCheck size={14} />
              </Button>
            </Link>
          </Tooltip>
          <Tooltip content="Quality Scoring" side="bottom">
            <Link href="/scoring">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Quality Scoring">
                <Gauge size={14} />
              </Button>
            </Link>
          </Tooltip>
          <Tooltip content="Brands" side="bottom">
            <Link href="/brands">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Brands">
                <Layers size={14} />
              </Button>
            </Link>
          </Tooltip>
          <Tooltip content="Onboarding" side="bottom">
            <Link href="/onboarding">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Onboarding">
                <GraduationCap size={14} />
              </Button>
            </Link>
          </Tooltip>
          <Tooltip content="3D Preview" side="bottom">
            <Link href="/spatial">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="3D Preview">
                <Box size={14} />
              </Button>
            </Link>
          </Tooltip>

          <PresetLoader />

          <Button variant="accent" size="sm" onClick={() => setExportOpen(true)} className="gap-1.5">
            <Download size={13} />
            {t("btn_export")}
          </Button>

          <div className="h-4 w-px bg-[var(--border)]" />

          {/* Profile / Auth — far right, avatar only */}
          <ProfileDropdown />
        </div>
      </header>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  )
}
