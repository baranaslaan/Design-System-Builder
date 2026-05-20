"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { useTokensStore } from "@/store/tokens"
import { FontPicker } from "./FontPicker"
import { loadFontFromFamily } from "@/lib/fontLoader"
import { CopyBadge } from "@/components/ui/CopyBadge"
import { EditableKey } from "@/components/ui/EditableKey"
import { useT } from "@/lib/i18n"

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 px-1">
      {children}
    </h4>
  )
}

function TokenRow({
  label,
  value,
  cssVar,
  onChange,
  onRename,
  preview,
}: {
  label: string
  value: string
  cssVar: string
  onChange: (v: string) => void
  onRename?: (newKey: string) => void
  preview?: React.ReactNode
}) {
  return (
    <motion.div
      layout
      className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
    >
      <div className="w-16 shrink-0">
        {onRename ? (
          <EditableKey value={label} onRename={onRename} />
        ) : (
          <span className="text-xs font-mono text-[var(--muted)]">{label}</span>
        )}
      </div>
      {preview && <div className="flex-1 min-w-0 overflow-hidden relative">{preview}</div>}
      <CopyBadge cssVar={cssVar} value={value} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      <input
        className="bg-[var(--surface-3)] border border-[var(--border)] rounded-md px-2 py-1 text-xs font-mono text-[var(--foreground)] w-24 text-right focus:outline-none focus:border-[var(--accent)] transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </motion.div>
  )
}

const DEFAULT_FONT_SIZE_ORDER = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"]
const DEFAULT_FONT_WEIGHT_ORDER = ["thin", "light", "regular", "medium", "semibold", "bold", "extrabold", "black"]
const DEFAULT_LINE_HEIGHT_ORDER = ["none", "tight", "snug", "normal", "relaxed", "loose"]

function sortedKeys(obj: Record<string, unknown>, defaultOrder: string[]): string[] {
  const keys = Object.keys(obj)
  return [
    ...defaultOrder.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !defaultOrder.includes(k)),
  ]
}

export function TypographyPanel({ filter = "" }: { filter?: string }) {
  const {
    tokens,
    updateFontSize, updateFontWeight, updateLineHeight, updateFontFamily,
    renameFontSize, renameFontWeight, renameLineHeight,
  } = useTokensStore()
  const t = useT()
  const { typography } = tokens
  const q = filter.toLowerCase()
  const match = (k: string, v: string) => !q || k.includes(q) || v.toLowerCase().includes(q)

  const sansFontName = typography.fontFamilies.sans.match(/^["']?([^,"']+)/)?.[1] ?? "sans-serif"

  const fontSizeKeys = sortedKeys(typography.fontSizes, DEFAULT_FONT_SIZE_ORDER)
  const fontWeightKeys = sortedKeys(typography.fontWeights as Record<string, unknown>, DEFAULT_FONT_WEIGHT_ORDER)
  const lineHeightKeys = sortedKeys(typography.lineHeights, DEFAULT_LINE_HEIGHT_ORDER)

  useEffect(() => {
    loadFontFromFamily(typography.fontFamilies.sans)
    loadFontFromFamily(typography.fontFamilies.serif)
    loadFontFromFamily(typography.fontFamilies.mono)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-7">

      {/* ── Type Scale visual ───────────────────────────────────── */}
      {!q && (
        <section>
          <SectionHeader>{t("section_type_scale")}</SectionHeader>
          <div className="bg-[var(--surface-2)] rounded-2xl p-4 border border-[var(--border)] overflow-hidden">
            <div className="flex flex-col gap-1">
              {[...fontSizeKeys].reverse().map((key) => {
                const size = typography.fontSizes[key]
                const px = parseFloat(size) * 16
                return (
                  <motion.div
                    key={key}
                    layout
                    className="flex items-center gap-3 group"
                  >
                    <span className="text-[9px] font-mono text-[var(--muted)] w-6 shrink-0 text-right opacity-60 group-hover:opacity-100 transition-opacity">
                      {key}
                    </span>
                    <div className="flex-1 overflow-hidden leading-none">
                      <span
                        className="text-[var(--foreground)] font-medium whitespace-nowrap block truncate"
                        style={{
                          fontSize: `min(${size}, 2.5rem)`,
                          fontFamily: typography.fontFamilies.sans,
                          lineHeight: 1.15,
                        }}
                      >
                        Ag
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-[var(--muted)] shrink-0 opacity-60">
                      {Math.round(px)}px
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Font Families ────────────────────────────────────────── */}
      <section>
        <SectionHeader>{t("section_font_families")}</SectionHeader>
        <div className="flex flex-col gap-3">
          {(["sans", "serif", "mono"] as const)
            .filter(key => match(key, typography.fontFamilies[key]))
            .map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 px-1 group/fam">
                  <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wide w-8">{key}</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <CopyBadge cssVar={`--font-family-${key}`} value={typography.fontFamilies[key]} className="opacity-0 group-hover/fam:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-2">
                  <FontPicker
                    label={key}
                    value={typography.fontFamilies[key]}
                    onChange={(v) => updateFontFamily(key, v)}
                  />
                </div>
                <input
                  className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-1.5 text-[10px] font-mono text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors focus:text-[var(--foreground)]"
                  value={typography.fontFamilies[key]}
                  onChange={(e) => updateFontFamily(key, e.target.value)}
                  placeholder="font-family CSS value"
                />
              </div>
            ))}
        </div>
      </section>

      {/* ── Font Sizes ───────────────────────────────────────────── */}
      <section>
        <SectionHeader>{t("section_font_sizes")}</SectionHeader>
        <div className="flex flex-col gap-0.5">
          {fontSizeKeys.filter(key => match(key, typography.fontSizes[key])).map((key) => (
            <TokenRow
              key={key}
              label={key}
              value={typography.fontSizes[key]}
              cssVar={`--font-size-${key}`}
              onChange={(v) => updateFontSize(key, v)}
              onRename={(newK) => renameFontSize(key, newK)}
              preview={
                <span
                  className="text-[var(--foreground)] font-medium block truncate"
                  style={{
                    fontSize: `min(${typography.fontSizes[key]}, 1.75rem)`,
                    fontFamily: typography.fontFamilies.sans,
                    lineHeight: 1.2,
                  }}
                >
                  {sansFontName}
                </span>
              }
            />
          ))}
        </div>
      </section>

      {/* ── Font Weights ─────────────────────────────────────────── */}
      <section>
        <SectionHeader>{t("section_font_weights")}</SectionHeader>
        <div className="flex flex-col gap-0.5">
          {fontWeightKeys.filter(key => match(key, String(typography.fontWeights[key]))).map((key) => (
            <TokenRow
              key={key}
              label={key}
              value={String(typography.fontWeights[key])}
              cssVar={`--font-weight-${key}`}
              onChange={(v) => updateFontWeight(key, Number(v))}
              onRename={(newK) => renameFontWeight(key, newK)}
              preview={
                <span
                  className="text-sm text-[var(--foreground)] truncate block"
                  style={{
                    fontWeight: typography.fontWeights[key],
                    fontFamily: typography.fontFamilies.sans,
                  }}
                >
                  The quick brown fox
                </span>
              }
            />
          ))}
        </div>
      </section>

      {/* ── Line Heights ─────────────────────────────────────────── */}
      <section>
        <SectionHeader>{t("section_line_heights")}</SectionHeader>
        <div className="flex flex-col gap-0.5">
          {lineHeightKeys.filter(key => match(key, typography.lineHeights[key])).map((key) => (
            <TokenRow
              key={key}
              label={key}
              value={typography.lineHeights[key]}
              cssVar={`--line-height-${key}`}
              onChange={(v) => updateLineHeight(key, v)}
              onRename={(newK) => renameLineHeight(key, newK)}
              preview={
                <div
                  className="text-[10px] text-[var(--muted)] leading-none"
                  style={{ lineHeight: typography.lineHeights[key] }}
                >
                  <div className="bg-[var(--accent)] opacity-20 h-full w-full absolute inset-0" />
                  Line<br />Height
                </div>
              }
            />
          ))}
        </div>
      </section>
    </div>
  )
}
