"use client"

import { useTokensStore } from "@/store/tokens"
import { useT } from "@/lib/i18n"
import { ScalePanel } from "./ScalePanel"

export function OpacityPanel({ filter = "" }: { filter?: string }) {
  const { tokens, updateOpacity, addOpacity, removeOpacity, renameOpacity } = useTokensStore()
  const t = useT()

  return (
    <ScalePanel
      scale={tokens.opacity ?? {}}
      cssVarPrefix="--opacity-"
      filter={filter}
      defaultValue="0.5"
      addLabel={t("btn_add_opacity")}
      onUpdate={updateOpacity}
      onAdd={addOpacity}
      onRemove={removeOpacity}
      onRename={renameOpacity}
      sort={(a, b, s) => (parseFloat(s[a]) || 0) - (parseFloat(s[b]) || 0)}
      renderVisual={(_, value) => {
        const pct = Math.max(0, Math.min(1, parseFloat(value) || 0))
        return (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-6 rounded-md relative overflow-hidden border border-[var(--border)]"
                 style={{ backgroundImage: "linear-gradient(45deg, var(--surface-3) 25%, transparent 25%, transparent 75%, var(--surface-3) 75%), linear-gradient(45deg, var(--surface-3) 25%, transparent 25%, transparent 75%, var(--surface-3) 75%)", backgroundSize: "8px 8px", backgroundPosition: "0 0, 4px 4px" }}>
              <div className="absolute inset-0 bg-[var(--accent)]" style={{ opacity: pct }} />
            </div>
            <span className="text-[10px] font-mono text-[var(--muted)] w-10 text-right">{Math.round(pct * 100)}%</span>
          </div>
        )
      }}
    />
  )
}
