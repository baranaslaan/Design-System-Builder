"use client"

import { useTokensStore } from "@/store/tokens"
import { useT } from "@/lib/i18n"
import { ScalePanel } from "./ScalePanel"

export function BlurPanel({ filter = "" }: { filter?: string }) {
  const { tokens, updateBlur, addBlur, removeBlur, renameBlur } = useTokensStore()
  const t = useT()

  return (
    <ScalePanel
      scale={tokens.blur ?? {}}
      cssVarPrefix="--blur-"
      filter={filter}
      defaultValue="8px"
      addLabel={t("btn_add_blur")}
      onUpdate={updateBlur}
      onAdd={addBlur}
      onRemove={removeBlur}
      onRename={renameBlur}
      sort={(a, b, s) => (parseInt(s[a]) || 0) - (parseInt(s[b]) || 0)}
      renderVisual={(_, value) => {
        const px = parseInt(value) || 0
        return (
          <div className="flex items-center gap-2 flex-1">
            <div className="relative h-7 w-16 overflow-hidden rounded-md border border-[var(--border)]"
                 style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)" }}>
              <div className="absolute inset-0" style={{ backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)` }} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow">Aa</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--muted)] flex-1">{px}px</span>
          </div>
        )
      }}
    />
  )
}
