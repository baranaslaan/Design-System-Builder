"use client"

import { motion } from "framer-motion"
import { useTokensStore } from "@/store/tokens"
import { Tooltip } from "@/components/ui/tooltip"
import { useT } from "@/lib/i18n"

export function LanguageToggle() {
  const { language, setLanguage } = useTokensStore()
  const t = useT()

  return (
    <Tooltip content={t("tooltip_lang_toggle")} side="bottom">
      {/*
        Pixel-perfect math — equal 4px insets on all sides of the active pill:
        - Container w-[66px] (border-box, 1px border each side) → inner content = 64px
        - Pill: w-6 (24px), top-1 bottom-1 (4px top + 4px bottom) → 24×24 square
        - Pill x for EN = 4 (left inset 4px ✓)
        - Pill x for TR = 64 - 4 - 24 = 36 (right inset 4px ✓)
        - Pill centers: 4+12=16 and 36+12=48
        - Each flex-1 span = 32px (0–32 and 32–64) → centers 16 and 48 match pill centers ✓
      */}
      <button
        onClick={() => setLanguage(language === "en" ? "tr" : "en")}
        className="relative inline-flex items-center h-8 w-[66px] rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition-colors overflow-hidden"
      >
        <motion.div
          className="absolute top-1 bottom-1 w-6 rounded-md bg-[var(--accent)]"
          animate={{ x: language === "en" ? 4 : 36 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        />
        <span
          className={`relative z-10 flex-1 text-[10px] font-bold text-center transition-colors ${
            language === "en" ? "text-white" : "text-[var(--muted)]"
          }`}
        >
          EN
        </span>
        <span
          className={`relative z-10 flex-1 text-[10px] font-bold text-center transition-colors ${
            language === "tr" ? "text-white" : "text-[var(--muted)]"
          }`}
        >
          TR
        </span>
      </button>
    </Tooltip>
  )
}
