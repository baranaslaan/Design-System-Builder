"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PanelRight, PanelRightClose, Monitor, Tablet, Smartphone, Columns2 } from "lucide-react"
import { Topbar } from "@/components/editor/Topbar"
import { Sidebar } from "@/components/editor/Sidebar"
import { EditorPanel } from "@/components/editor/EditorPanel"
import { ComponentPreview } from "@/components/preview/ComponentPreview"
import { DeviceFrame } from "@/components/preview/DeviceFrame"
import { TokenSearch } from "@/components/editor/TokenSearch"
import { TooltipProvider, Tooltip } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import type { Breakpoint } from "@/types/tokens"

type PreviewMode = Breakpoint | "split"

const BREAKPOINT_PANEL_WIDTH: Record<PreviewMode, number> = {
  desktop: 380,
  tablet:  400,
  mobile:  320,
  split:   660,
}

const BREAKPOINT_BUTTONS: { key: PreviewMode; icon: React.ReactNode; label: string }[] = [
  { key: "desktop", icon: <Monitor size={12} />,   label: "Desktop" },
  { key: "tablet",  icon: <Tablet size={12} />,    label: "Tablet"  },
  { key: "mobile",  icon: <Smartphone size={12} />, label: "Mobile"  },
  { key: "split",   icon: <Columns2 size={12} />,   label: "Split"   },
]

export default function Home() {
  const [previewOpen,  setPreviewOpen]  = useState(true)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [previewMode,  setPreviewMode]  = useState<PreviewMode>("desktop")

  const panelWidth = BREAKPOINT_PANEL_WIDTH[previewMode]

  // Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(p => !p) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--background)]">
        <Topbar onSearchOpen={() => setSearchOpen(true)} />

        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <EditorPanel />

          {/* Preview panel */}
          <motion.div
            animate={{ width: previewOpen ? panelWidth : 0, opacity: previewOpen ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="flex-shrink-0 overflow-hidden border-l border-[var(--border)]"
          >
            <div className="h-full flex flex-col" style={{ width: panelWidth }}>
              {/* Preview header */}
              <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold text-[var(--foreground)] flex-shrink-0">Preview</span>

                {/* Breakpoint switcher */}
                <div className="flex items-center gap-0.5 bg-[var(--surface-2)] rounded-lg p-0.5 ml-1">
                  {BREAKPOINT_BUTTONS.map(({ key, icon, label }) => (
                    <Tooltip key={key} content={label} side="bottom">
                      <motion.button
                        onClick={() => setPreviewMode(key)}
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

                {/* Width badge */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={previewMode}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="ml-auto text-[10px] font-mono text-[var(--muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded"
                  >
                    {previewMode === "split"   ? "375 + 1280"
                     : previewMode === "mobile"  ? "390px"
                     : previewMode === "tablet"  ? "768px"
                     : "1280px"}
                  </motion.span>
                </AnimatePresence>
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

          {/* Toggle button */}
          <div className="flex flex-col items-center py-4 px-1.5 border-l border-[var(--border)]">
            <Tooltip content={previewOpen ? "Hide preview" : "Show preview"} side="left">
              <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(!previewOpen)} className="h-8 w-8">
                <motion.div animate={{ rotate: previewOpen ? 0 : 180 }}>
                  {previewOpen ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
                </motion.div>
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
