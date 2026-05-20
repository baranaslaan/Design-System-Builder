"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PanelRight, PanelRightClose, Monitor, Tablet, Smartphone, Columns2, HelpCircle, RotateCcw } from "lucide-react"
import { Topbar } from "@/components/editor/Topbar"
import { Sidebar } from "@/components/editor/Sidebar"
import { EditorPanel } from "@/components/editor/EditorPanel"
import { ComponentPreview } from "@/components/preview/ComponentPreview"
import { DeviceFrame } from "@/components/preview/DeviceFrame"
import { TokenSearch } from "@/components/editor/TokenSearch"
import { HelpCenter } from "@/components/editor/HelpCenter"
import { TooltipProvider, Tooltip } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { useTokensStore } from "@/store/tokens"
import { useT } from "@/lib/i18n"
import type { Breakpoint } from "@/types/tokens"

type PreviewMode = Breakpoint | "split"

const BREAKPOINT_PANEL_WIDTH: Record<PreviewMode, number> = {
  desktop: 480,
  tablet:  440,
  mobile:  380,
  split:   720,
}

// Per-mode minimums (split needs more room for two frames)
const MIN_PANEL_WIDTH: Record<PreviewMode, number> = {
  desktop: 380,
  tablet:  380,
  mobile:  340,
  split:   600,
}

// Viewport-aware max: leave room for sidebar (~210px) + editor (~360px min)
const computeMaxPanelWidth = () => {
  if (typeof window === "undefined") return 1100
  return Math.max(600, Math.min(1200, window.innerWidth - 570))
}

const BREAKPOINT_BUTTONS: { key: PreviewMode; icon: React.ReactNode; label: string }[] = [
  { key: "desktop", icon: <Monitor size={12} />,   label: "Desktop" },
  { key: "tablet",  icon: <Tablet size={12} />,    label: "Tablet"  },
  { key: "mobile",  icon: <Smartphone size={12} />, label: "Mobile"  },
  { key: "split",   icon: <Columns2 size={12} />,   label: "Split"   },
]

export default function Home() {
  const { hasSeenOnboarding, setHasSeenOnboarding, previewWidth, setPreviewWidth } = useTokensStore()
  const t = useT()

  const [previewOpen,  setPreviewOpen]  = useState(true)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [helpOpen,     setHelpOpen]     = useState(false)
  const [previewMode,  setPreviewMode]  = useState<PreviewMode>("desktop")
  const [isDragging,   setIsDragging]   = useState(false)
  const [maxWidth,     setMaxWidth]     = useState(() => computeMaxPanelWidth())

  // Effective preview panel width (manual override or breakpoint default), clamped
  const breakpointDefault = BREAKPOINT_PANEL_WIDTH[previewMode]
  const minWidth = MIN_PANEL_WIDTH[previewMode]
  const raw = previewWidth ?? breakpointDefault
  const panelWidth = Math.max(minWidth, Math.min(maxWidth, raw))

  // ── Recompute max on viewport resize, clamp current width ──────────────
  useEffect(() => {
    const onResize = () => setMaxWidth(computeMaxPanelWidth())
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // If manual width violates new mode's bounds, snap to default
  useEffect(() => {
    if (previewWidth === null) return
    if (previewWidth < minWidth || previewWidth > maxWidth) {
      setPreviewWidth(Math.max(minWidth, Math.min(maxWidth, previewWidth)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minWidth, maxWidth])

  // ── First-launch onboarding ────────────────────────────────────────────
  useEffect(() => {
    if (!hasSeenOnboarding) {
      // Slight delay so app renders first
      const t = setTimeout(() => setHelpOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [hasSeenOnboarding])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); setSearchOpen((p) => !p)
      }
      if (!isTyping && e.key === "?") {
        e.preventDefault(); setHelpOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // ── Resizer drag handlers ──────────────────────────────────────────────
  const startDragRef = useRef<{ x: number; w: number } | null>(null)

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!startDragRef.current) return
    const { x, w } = startDragRef.current
    const dx = e.clientX - x
    // Dragging left grows panel (panel is on the right)
    const newW = Math.max(minWidth, Math.min(maxWidth, w - dx))
    setPreviewWidth(newW)
  }, [setPreviewWidth, minWidth, maxWidth])

  const onMouseUp = useCallback(() => {
    setIsDragging(false)
    startDragRef.current = null
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup", onMouseUp)
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [onMouseMove])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startDragRef.current = { x: e.clientX, w: panelWidth }
    setIsDragging(true)
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const closeHelp = () => {
    setHelpOpen(false)
    if (!hasSeenOnboarding) setHasSeenOnboarding(true)
  }

  // Switching breakpoint resets manual width to that breakpoint's default
  const handleBreakpointChange = (mode: PreviewMode) => {
    setPreviewMode(mode)
    setPreviewWidth(null)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--background)]">
        <Topbar
          onSearchOpen={() => setSearchOpen(true)}
          onHelpOpen={() => setHelpOpen(true)}
        />

        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <EditorPanel />

          {/* Resize handle */}
          {previewOpen && (
            <div
              onMouseDown={onMouseDown}
              onDoubleClick={() => setPreviewWidth(null)}
              title="Drag to resize • Double-click to reset"
              className="group relative w-1 flex-shrink-0 cursor-col-resize hover:bg-[var(--accent)] transition-colors"
              style={{
                background: isDragging ? "var(--accent)" : "var(--border)",
              }}
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
              {/* Drag grip dots */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
              </div>
            </div>
          )}

          {/* Preview panel */}
          <motion.div
            animate={{ width: previewOpen ? panelWidth : 0, opacity: previewOpen ? 1 : 0 }}
            transition={isDragging
              ? { duration: 0 }
              : { type: "spring", stiffness: 280, damping: 32 }}
            className="flex-shrink-0 overflow-hidden"
          >
            <div className="h-full flex flex-col" style={{ width: panelWidth }}>
              {/* Preview header */}
              <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold text-[var(--foreground)] flex-shrink-0">{t("preview_label")}</span>

                {/* Breakpoint switcher */}
                <div className="flex items-center gap-0.5 bg-[var(--surface-2)] rounded-lg p-0.5 ml-1">
                  {BREAKPOINT_BUTTONS.map(({ key, icon, label }) => (
                    <Tooltip key={key} content={label} side="bottom">
                      <motion.button
                        onClick={() => handleBreakpointChange(key)}
                        whileTap={{ scale: 0.9 }}
                        className="relative flex items-center justify-center w-7 h-6 rounded-md transition-colors"
                        style={{ color: previewMode === key ? "var(--foreground)" : "var(--muted)" }}
                      >
                        {previewMode === key && (
                          <motion.div
                            layoutId="bp-active"
                            className="absolute inset-0 bg-[var(--surface-3)] rounded-md border border-[var(--border)]"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{icon}</span>
                      </motion.button>
                    </Tooltip>
                  ))}
                </div>

                {/* Manual-width reset */}
                {previewWidth !== null && (
                  <Tooltip content="Reset to breakpoint default" side="bottom">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setPreviewWidth(null)}
                      className="flex items-center justify-center w-6 h-6 rounded-md text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <RotateCcw size={11} />
                    </motion.button>
                  </Tooltip>
                )}

                {/* Width badge */}
                <Tooltip content={t("preview_tooltip_min_max", { min: minWidth, max: maxWidth })} side="bottom">
                  <motion.span
                    key={`${previewMode}-${Math.round(panelWidth)}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-auto text-[10px] font-mono text-[var(--muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded cursor-help"
                    style={{
                      color: panelWidth <= minWidth || panelWidth >= maxWidth ? "var(--accent)" : undefined,
                    }}
                  >
                    {Math.round(panelWidth)}px
                  </motion.span>
                </Tooltip>
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {previewMode === "split" ? (
                  <SplitPreview panelWidth={panelWidth} />
                ) : (
                  <DeviceFrame breakpoint={previewMode} panelWidth={panelWidth}>
                    <ComponentPreview />
                  </DeviceFrame>
                )}
              </div>
            </div>
          </motion.div>

          <TokenSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
          <HelpCenter open={helpOpen} onClose={closeHelp} />

          {/* Toggle button */}
          <div className="flex flex-col items-center py-4 px-1.5 border-l border-[var(--border)] gap-1">
            <Tooltip content={previewOpen ? t("tooltip_hide_preview") : t("tooltip_show_preview")} side="left">
              <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(!previewOpen)} className="h-8 w-8">
                <motion.div animate={{ rotate: previewOpen ? 0 : 180 }}>
                  {previewOpen ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
                </motion.div>
              </Button>
            </Tooltip>
            <Tooltip content={t("tooltip_help")} side="left">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHelpOpen(true)}
                className="h-8 w-8 text-[var(--muted)] hover:text-[var(--accent)]"
              >
                <HelpCircle size={14} />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ── Split view ────────────────────────────────────────────────────────────────
function SplitPreview({ panelWidth }: { panelWidth: number }) {
  const halfW = Math.floor((panelWidth - 12) / 2)
  return (
    <div className="flex gap-2 p-3 h-full">
      {/* Mobile */}
      <div className="flex flex-col gap-1.5" style={{ width: halfW }}>
        <div className="flex items-center gap-1.5">
          <Smartphone size={10} className="text-[var(--muted)]" />
          <span className="text-[9px] font-mono text-[var(--muted)] uppercase tracking-wide">Mobile 390</span>
        </div>
        <div className="flex-1 overflow-hidden rounded-xl border border-[var(--border)]">
          <DeviceFrame breakpoint="mobile" panelWidth={halfW}>
            <ComponentPreview />
          </DeviceFrame>
        </div>
      </div>
      {/* Desktop */}
      <div className="flex flex-col gap-1.5" style={{ width: halfW }}>
        <div className="flex items-center gap-1.5">
          <Monitor size={10} className="text-[var(--muted)]" />
          <span className="text-[9px] font-mono text-[var(--muted)] uppercase tracking-wide">Desktop 1280</span>
        </div>
        <div className="flex-1 overflow-hidden rounded-xl border border-[var(--border)]">
          <DeviceFrame breakpoint="tablet" panelWidth={halfW}>
            <ComponentPreview />
          </DeviceFrame>
        </div>
      </div>
    </div>
  )
}
