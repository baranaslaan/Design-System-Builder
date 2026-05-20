"use client"

import { useTokensStore } from "@/store/tokens"
import { useT } from "@/lib/i18n"
import { ScalePanel } from "./ScalePanel"

export function ZIndexPanel({ filter = "" }: { filter?: string }) {
  const { tokens, updateZIndex, addZIndex, removeZIndex, renameZIndex } = useTokensStore()
  const t = useT()
  const values = Object.values(tokens.zIndex ?? {}).map((v) => parseInt(v) || 0).filter((n) => Number.isFinite(n))
  const max = Math.max(...values, 100)
  const min = Math.min(...values, 0)

  return (
    <ScalePanel
      scale={tokens.zIndex ?? {}}
      cssVarPrefix="--z-"
      filter={filter}
      defaultValue="10"
      addLabel={t("btn_add_zindex")}
      onUpdate={updateZIndex}
      onAdd={addZIndex}
      onRemove={removeZIndex}
      onRename={renameZIndex}
      sort={(a, b, s) => {
        const na = parseInt(s[a]); const nb = parseInt(s[b])
        if (isNaN(na) && isNaN(nb)) return a.localeCompare(b)
        if (isNaN(na)) return 1
        if (isNaN(nb)) return -1
        return na - nb
      }}
      renderVisual={(_, value) => {
        const n = parseInt(value)
        const isAuto = value === "auto" || isNaN(n)
        const ratio = isAuto ? 0 : (n - min) / Math.max(max - min, 1)
        return (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-3 relative">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute h-2.5 rounded-sm border border-[var(--border)]"
                  style={{
                    background: i === 2 ? "var(--accent)" : "var(--surface-3)",
                    width: 28 - i * 4,
                    left: `${i * 6}px`,
                    top: i * 2,
                    opacity: isAuto ? 0.3 : 0.4 + i * 0.2,
                    zIndex: i,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-[var(--muted)] w-14 text-right">{isAuto ? "auto" : `${Math.round(ratio * 100)}%`}</span>
          </div>
        )
      }}
    />
  )
}
