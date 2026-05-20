"use client"

import { useTokensStore } from "@/store/tokens"
import { useT } from "@/lib/i18n"
import { ScalePanel } from "./ScalePanel"

export function BreakpointsPanel({ filter = "" }: { filter?: string }) {
  const { tokens, updateBreakpoint, addBreakpoint, removeBreakpoint, renameBreakpoint } = useTokensStore()
  const t = useT()
  const maxPx = Math.max(...Object.values(tokens.breakpoints ?? {}).map((v) => parseInt(v) || 0), 1920)

  return (
    <ScalePanel
      scale={tokens.breakpoints ?? {}}
      cssVarPrefix="--breakpoint-"
      filter={filter}
      defaultValue="768px"
      addLabel={t("btn_add_breakpoint")}
      onUpdate={updateBreakpoint}
      onAdd={addBreakpoint}
      onRemove={removeBreakpoint}
      onRename={renameBreakpoint}
      sort={(a, b, s) => (parseInt(s[a]) || 0) - (parseInt(s[b]) || 0)}
      renderVisual={(_, value) => {
        const px = parseInt(value) || 0
        const ratio = Math.min(px / maxPx, 1)
        return (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${ratio * 100}%` }} />
            </div>
            <span className="text-[10px] font-mono text-[var(--muted)] w-12 text-right">{px}px</span>
          </div>
        )
      }}
    />
  )
}
