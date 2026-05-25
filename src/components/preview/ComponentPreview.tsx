"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTokensStore } from "@/store/tokens"
import { CodePeek } from "./CodePeek"
import {
  buttonCode, badgeCode, elevatedCardCode, inputCode,
  alertCode, accordionCode, progressCode, avatarGroupCode, toastCode,
} from "@/lib/componentCode"

type PreviewTab = "components" | "forms" | "table" | "navigation" | "feedback"

const PREVIEW_TABS: { key: PreviewTab; label: string }[] = [
  { key: "components", label: "Components" },
  { key: "forms",      label: "Forms" },
  { key: "table",      label: "Table" },
  { key: "navigation", label: "Nav" },
  { key: "feedback",   label: "Feedback" },
]

// In-tab section anchors — drives the sticky TOC pill row + scroll-spy.
const SECTIONS: Record<PreviewTab, { id: string; label: string }[]> = {
  components: [
    { id: "typography", label: "Type" },
    { id: "buttons",    label: "Buttons" },
    { id: "badges",     label: "Badges" },
    { id: "cards",      label: "Cards" },
    { id: "accordion",  label: "Accordion" },
    { id: "avatars",    label: "Avatars" },
  ],
  forms: [
    { id: "inputs",   label: "Inputs" },
    { id: "select",   label: "Select" },
    { id: "controls", label: "Controls" },
    { id: "textarea", label: "Textarea" },
  ],
  table: [],
  navigation: [
    { id: "navbar",     label: "Navbar" },
    { id: "tabs",       label: "Tabs" },
    { id: "breadcrumb", label: "Crumb" },
    { id: "sidebar",    label: "Sidebar" },
    { id: "palette",    label: "Palette" },
  ],
  feedback: [
    { id: "alerts",   label: "Alerts" },
    { id: "toasts",   label: "Toasts" },
    { id: "progress", label: "Progress" },
    { id: "loading",  label: "Loading" },
  ],
}

const STICKY_OFFSET = 88 // tab bar (~38) + TOC row (~38) + breathing room

export function ComponentPreview() {
  const { tokens, previewMode, setPreviewMode } = useTokensStore()
  const [activeTab, setActiveTab] = useState<PreviewTab>("components")
  const [activeSection, setActiveSection] = useState<string>("")
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const tocRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const { colors, typography, radius, stroke, shadows } = tokens
  const isDark = previewMode === "dark"

  const sem = (id: string) => {
    const c = colors.semantic.find((s) => s.id === id)
    if (!c) return "#888"
    return isDark ? c.darkValue : c.lightValue
  }

  const bg        = isDark ? "#09090b" : "#ffffff"
  const surface   = isDark ? "#18181b" : "#f4f4f5"
  const surface2  = isDark ? "#27272a" : "#e4e4e7"
  const border    = isDark ? "#3f3f46" : "#d4d4d8"
  const fg        = isDark ? "#fafafa" : "#09090b"
  const fgMuted   = isDark ? "#a1a1aa" : "#71717a"

  const baseRadius  = radius.lg  ?? "8px"
  const xlRadius    = radius.xl  ?? "12px"
  const fullRadius  = radius.full ?? "9999px"
  const shadowBase  = shadows[1]?.value ?? "0 1px 3px rgb(0 0 0 / 0.1)"
  const shadowLg    = shadows[3]?.value ?? "0 10px 15px rgb(0 0 0 / 0.1)"
  const strokeBase  = stroke[1] ?? "1px"
  const fs          = typography.fontSizes
  const ff          = typography.fontFamilies.sans

  const sections = SECTIONS[activeTab]
  const hasToc   = sections.length > 1

  // ── Scroll-elevation + scroll-spy on the inner scroll container ──────────
  // Direct scrollTop-based scrollspy: pick the section whose top is closest to
  // (but not below) the sticky-chrome line. Handles "reached bottom" correctly.
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrolled(el.scrollTop > 2)
    if (!hasToc) return

    const rootTop = el.getBoundingClientRect().top
    const sectionEls = el.querySelectorAll<HTMLElement>("[data-section]")
    if (!sectionEls.length) return

    // If at the bottom of the scroll, force the last section.
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4
    if (atBottom) {
      const last = sectionEls[sectionEls.length - 1]
      setActiveSection(last.dataset.section ?? "")
      return
    }

    // Otherwise: the section whose top is just above the chrome line wins.
    let current: HTMLElement | undefined
    for (const s of sectionEls) {
      const top = s.getBoundingClientRect().top - rootTop
      if (top - STICKY_OFFSET <= 8) current = s
      else break
    }
    if (current) setActiveSection(current.dataset.section ?? "")
  }, [hasToc])

  // Reset to first section + recompute when tab changes.
  useLayoutEffect(() => {
    setActiveSection(sections[0]?.id ?? "")
    // Defer one frame so the new tab's sections are in the DOM.
    const raf = requestAnimationFrame(updateScrollState)
    return () => cancelAnimationFrame(raf)
  }, [activeTab, sections, updateScrollState])

  // Keep active tab centered in the horizontally-scrolling tab strip.
  useEffect(() => {
    tabRefs.current[activeTab]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [activeTab])

  // Keep active TOC pill centered when scroll-spy advances it.
  useEffect(() => {
    if (activeSection) tocRefs.current[activeSection]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [activeSection])

  // Reset scroll when switching tabs so users land at the top of the new content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" })
  }, [activeTab])

  const scrollToSection = useCallback((id: string) => {
    const root = scrollRef.current
    if (!root) return
    const target = root.querySelector<HTMLElement>(`[data-section="${id}"]`)
    if (!target) return
    // Compute target relative to the scroll container, not the offsetParent
    // (motion.div breaks offsetTop). Use bounding rects.
    const rootRect = root.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const top = root.scrollTop + (targetRect.top - rootRect.top) - STICKY_OFFSET + 4
    root.scrollTop = top
  }, [])

  // Arrow-key navigation across tabs (a11y).
  const onTabKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault()
      const dir = e.key === "ArrowRight" ? 1 : -1
      const next = PREVIEW_TABS[(idx + dir + PREVIEW_TABS.length) % PREVIEW_TABS.length]
      setActiveTab(next.key)
      tabRefs.current[next.key]?.focus()
    } else if (e.key === "Home") {
      e.preventDefault()
      setActiveTab(PREVIEW_TABS[0].key)
    } else if (e.key === "End") {
      e.preventDefault()
      setActiveTab(PREVIEW_TABS[PREVIEW_TABS.length - 1].key)
    }
  }

  const shared = { bg, surface, surface2, border, fg, fgMuted, sem, accent: sem("primary"), baseRadius, xlRadius, fullRadius, shadowBase, shadowLg, strokeBase, fs }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: bg,
        fontFamily: ff,
        // Mode change animates via root color transition (no jarring re-mount).
        transition: "background-color 220ms ease, color 220ms ease",
        color: fg,
      }}
    >
      {/* ─── Sticky chrome: tab bar + TOC ────────────────────────────────── */}
      <div
        className="flex flex-col flex-shrink-0 sticky top-0 z-20"
        style={{
          background: bg,
          borderBottom: `${strokeBase} solid ${border}`,
          boxShadow: scrolled ? `0 4px 12px -8px ${isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.12)"}` : "none",
          transition: "box-shadow 180ms ease",
        }}
      >
        {/* Tab bar */}
        <div className="flex items-stretch gap-2 px-4 py-2 min-w-0" style={{ background: surface }}>
          <div
            role="tablist"
            aria-label="Preview categories"
            className="flex gap-0.5 flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent 0, black 6px, black calc(100% - 6px), transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0, black 6px, black calc(100% - 6px), transparent 100%)",
            }}
          >
            {PREVIEW_TABS.map((t, idx) => {
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  ref={(el) => { tabRefs.current[t.key] = el }}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${t.key}`}
                  id={`tab-${t.key}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(t.key)}
                  onKeyDown={(e) => onTabKey(e, idx)}
                  className="relative px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    color: isActive ? sem("primary") : fgMuted,
                    transition: "color 160ms ease",
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="preview-tab-active"
                      className="absolute inset-0 rounded-md"
                      style={{ background: sem("primary") + "1f" }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Mode toggle — pill with magnetic indicator */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-lg flex-shrink-0"
            style={{ background: surface2 }}
            role="group"
            aria-label="Preview color mode"
          >
            {([["light", Sun, "Light"], ["dark", Moon, "Dark"]] as const).map(([mode, Icon, label]) => {
              const isActiveMode = previewMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  className="relative flex items-center justify-center w-6 h-6 rounded-md focus:outline-none focus-visible:ring-2"
                  style={{ color: isActiveMode ? fg : fgMuted, transition: "color 160ms ease" }}
                  title={`${label} mode`}
                  aria-label={`${label} mode`}
                  aria-pressed={isActiveMode}
                >
                  {isActiveMode && (
                    <motion.span
                      layoutId="preview-mode-active"
                      className="absolute inset-0 rounded-md"
                      style={{
                        background: isDark ? "#3f3f46" : "#fff",
                        boxShadow: shadowBase,
                      }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={12} className="relative" />
                </button>
              )
            })}
          </div>
        </div>

        {/* TOC row — pill chips, scroll-spy + jump on click */}
        {hasToc && (
          <div
            className="flex items-center gap-1 px-4 py-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              background: bg,
              borderTop: `${strokeBase} solid ${border}`,
              maskImage: "linear-gradient(to right, transparent 0, black 8px, black calc(100% - 8px), transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0, black 8px, black calc(100% - 8px), transparent 100%)",
            }}
            role="navigation"
            aria-label="Section index"
          >
            {sections.map((s, i) => {
              const isActive = activeSection === s.id
              return (
                <button
                  key={s.id}
                  ref={(el) => { tocRefs.current[s.id] = el }}
                  onClick={() => scrollToSection(s.id)}
                  className="flex items-center gap-1.5 flex-shrink-0 px-2 py-0.5 rounded-full focus:outline-none focus-visible:ring-2"
                  style={{
                    color: isActive ? fg : fgMuted,
                    background: isActive ? surface : "transparent",
                    border: `1px solid ${isActive ? border : "transparent"}`,
                    transition: "color 160ms ease, background-color 160ms ease, border-color 160ms ease",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                      fontSize: 9,
                      fontVariantNumeric: "tabular-nums",
                      color: isActive ? sem("primary") : fgMuted,
                      letterSpacing: "0.04em",
                      opacity: 0.85,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 500 }}>{s.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Scrollable content ──────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex-1 overflow-y-auto overflow-x-clip p-4"
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
        >
          {activeTab === "components" && <ComponentsTab {...shared} />}
          {activeTab === "forms"      && <FormsTab      {...shared} />}
          {activeTab === "table"      && <TableTab      {...shared} />}
          {activeTab === "navigation" && <NavigationTab {...shared} tokens={tokens} />}
          {activeTab === "feedback"   && <FeedbackTab   {...shared} />}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
// Editorial-docs treatment: mono index · hairline · uppercase label · count.
function Section({
  id, index, label, count, fg, fgMuted, accent, children,
}: {
  id: string
  index: number
  label: string
  count?: number
  fg: string
  fgMuted: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <section
      data-section={id}
      id={`section-${id}`}
      style={{ scrollMarginTop: STICKY_OFFSET }}
    >
      <header className="flex items-baseline gap-2 mb-3">
        <span
          style={{
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: 10,
            fontVariantNumeric: "tabular-nums",
            color: fgMuted,
            letterSpacing: "0.06em",
            lineHeight: 1,
          }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <span style={{ width: 14, height: 1, background: accent, opacity: 0.45, alignSelf: "center" }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: fg,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {label}
        </span>
        {count != null && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
              fontSize: 10,
              color: fgMuted,
              fontVariantNumeric: "tabular-nums",
              opacity: 0.75,
            }}
          >
            {count}
          </span>
        )}
      </header>
      {children}
    </section>
  )
}

type TabProps = {
  bg: string; surface: string; surface2: string; border: string; fg: string; fgMuted: string
  sem: (id: string) => string; accent: string
  baseRadius: string; xlRadius: string; fullRadius: string
  shadowBase: string; shadowLg: string; strokeBase: string
  fs: Record<string, string>
}

// ─── Components Tab ───────────────────────────────────────────────────────────
function ComponentsTab(p: TabProps) {
  const { bg, surface, surface2, border, fg, fgMuted, sem, accent, baseRadius, xlRadius, fullRadius, shadowBase, shadowLg, strokeBase, fs } = p
  return (
    <div className="flex flex-col gap-7">
      <Section id="typography" index={1} label="Typography" count={6} fg={fg} fgMuted={fgMuted} accent={accent}>
        {[{ size: fs["4xl"], w: 700, text: "Display" }, { size: fs["2xl"], w: 600, text: "Heading" }, { size: fs.lg, w: 500, text: "Subheading" }, { size: fs.base, w: 400, text: "Body text" }, { size: fs.sm, w: 400, text: "Small" }, { size: fs.xs, w: 400, text: "Caption" }].map(({ size, w, text }) => (
          <div key={text} style={{ fontSize: size, fontWeight: w, color: fg, lineHeight: 1.3 }}>{text}</div>
        ))}
      </Section>

      <Section id="buttons" index={2} label="Buttons" count={4} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="flex flex-wrap gap-2">
          {([
            { variant: "primary" as const, btnBg: sem("primary"), color: "#fff", label: "Primary" },
            { variant: "success" as const, btnBg: sem("success"), color: "#fff", label: "Success" },
            { variant: "danger" as const,  btnBg: sem("danger"),  color: "#fff", label: "Danger" },
            { variant: "outline" as const, btnBg: "transparent",  color: fg,     label: "Outline", border: `${strokeBase} solid ${border}` },
          ]).map(({ variant, btnBg, color, label, border: b }) => (
            <CodePeek key={label} spec={buttonCode(variant, label)} inline>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ background: btnBg, color, borderRadius: baseRadius, border: b, padding: "6px 16px", fontSize: fs.sm, fontWeight: 500, cursor: "pointer", boxShadow: shadowBase }}
              >{label}</motion.button>
            </CodePeek>
          ))}
        </div>
      </Section>

      <Section id="badges" index={3} label="Badges" count={4} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="flex flex-wrap gap-2">
          {([
            ["primary", "Primary"],
            ["success", "Success"],
            ["danger",  "Error"],
            ["warning", "Warning"],
          ] as const).map(([id, label]) => (
            <CodePeek key={id} spec={badgeCode(id, label)} inline>
              <span style={{ background: sem(id) + "20", color: sem(id), borderRadius: fullRadius, padding: "3px 10px", fontSize: fs.xs, fontWeight: 500 }}>{label}</span>
            </CodePeek>
          ))}
        </div>
      </Section>

      <Section id="cards" index={4} label="Cards" count={2} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="grid grid-cols-2 gap-3">
          <CodePeek spec={elevatedCardCode()}>
            <div style={{ background: surface, borderRadius: xlRadius, padding: 16, boxShadow: shadowLg, border: `${strokeBase} solid ${border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: baseRadius, background: sem("primary") + "20", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: sem("primary") }} />
              </div>
              <div style={{ fontSize: fs.sm, fontWeight: 600, color: fg, marginBottom: 4 }}>Elevated Card</div>
              <div style={{ fontSize: fs.xs, color: fgMuted, lineHeight: 1.5 }}>Uses radius, shadow and stroke tokens.</div>
            </div>
          </CodePeek>
          <CodePeek spec={elevatedCardCode()}>
            <div style={{ background: `linear-gradient(135deg, ${sem("primary")}15, ${sem("info")}10)`, borderRadius: xlRadius, padding: 16, border: `${strokeBase} solid ${sem("primary")}30`, height: "100%" }}>
              <div style={{ fontSize: fs.xs, color: sem("primary"), fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>FEATURED</div>
              <div style={{ fontSize: fs.sm, fontWeight: 700, color: fg, marginBottom: 4 }}>Token Card</div>
              <div style={{ fontSize: fs.xs, color: fgMuted, lineHeight: 1.5 }}>Semantic + palette colors.</div>
            </div>
          </CodePeek>
        </div>
      </Section>

      <Section id="accordion" index={5} label="Accordion" count={3} fg={fg} fgMuted={fgMuted} accent={accent}>
        <CodePeek spec={accordionCode()}>
          <AccordionPreview {...{ surface, surface2, border, fg, fgMuted, baseRadius, strokeBase, fs }} />
        </CodePeek>
      </Section>

      <Section id="avatars" index={6} label="Avatars" count={5} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CodePeek spec={avatarGroupCode()} inline>
            <div style={{ display: "flex", alignItems: "center" }}>
              {([
                { initials: "AJ", color: sem("primary") },
                { initials: "BM", color: sem("success") },
                { initials: "CL", color: sem("warning") },
                { initials: "DC", color: sem("danger") },
              ] as const).map((av, i) => (
                <div key={av.initials} style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: av.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: fs.xs, fontWeight: 600,
                  border: `2px solid ${bg}`,
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: 4 - i, position: "relative",
                }}>{av.initials}</div>
              ))}
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: surface2, color: fgMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: fs.xs, fontWeight: 600,
                border: `2px solid ${bg}`,
                marginLeft: -8,
              }}>+2</div>
            </div>
          </CodePeek>
          <div style={{ display: "flex", gap: 6 }}>
            {[sem("primary"), sem("success"), sem("warning"), sem("danger"), surface2].map((c, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: "50%",
                background: c, color: i === 4 ? fgMuted : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px", fontWeight: 700,
                border: `2px solid ${bg}`,
              }}>{["AB","CD","EF","GH","+3"][i]}</div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}

// ─── Forms Tab ────────────────────────────────────────────────────────────────
function FormsTab(p: TabProps) {
  const { surface, surface2, border, fg, fgMuted, sem, accent, baseRadius, fullRadius, shadowBase, strokeBase, fs } = p
  const [checked, setChecked] = useState(false)
  const [toggle, setToggle] = useState(true)
  const [selected, setSelected] = useState("option1")

  return (
    <div className="flex flex-col gap-7">
      <Section id="inputs" index={1} label="Text Inputs" count={4} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="flex flex-col gap-2">
          {([
            { label: "Default",  placeholder: "Enter text...",  state: "default" as const },
            { label: "Focus",    placeholder: "Focused input",  state: "focus"   as const },
            { label: "Error",    placeholder: "Invalid value",  state: "error"   as const },
            { label: "Disabled", placeholder: "Disabled",       state: "disabled" as const },
          ]).map(({ label, placeholder, state }) => (
            <div key={label} className="flex flex-col gap-1">
              <label style={{ fontSize: fs.xs, fontWeight: 500, color: fgMuted }}>{label}</label>
              <CodePeek spec={inputCode(state)}>
                <input
                  disabled={state === "disabled"}
                  defaultValue={state === "error" ? "wrong@" : ""}
                  placeholder={placeholder}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: baseRadius,
                    border: `${strokeBase} solid ${state === "error" ? sem("danger") : state === "focus" ? sem("primary") : border}`,
                    background: state === "disabled" ? surface2 : surface,
                    color: state === "disabled" ? fgMuted : fg,
                    fontSize: fs.sm,
                    outline: "none",
                    boxShadow: state === "focus" ? `0 0 0 3px ${sem("primary")}30` : "none",
                    opacity: state === "disabled" ? 0.6 : 1,
                  }}
                  readOnly
                />
              </CodePeek>
              {state === "error" && <span style={{ fontSize: fs.xs, color: sem("danger") }}>Please enter a valid email</span>}
            </div>
          ))}
        </div>
      </Section>

      <Section id="select" index={2} label="Select" fg={fg} fgMuted={fgMuted} accent={accent}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ width: "100%", padding: "7px 10px", borderRadius: baseRadius, border: `${strokeBase} solid ${border}`, background: surface, color: fg, fontSize: fs.sm, cursor: "pointer" }}
        >
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
      </Section>

      <Section id="controls" index={3} label="Controls" count={2} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setChecked(!checked)}
            className="flex items-center gap-2.5 cursor-pointer"
            style={{ background: "transparent", border: "none", padding: 0, textAlign: "left" }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: "4px", flexShrink: 0,
              border: `2px solid ${checked ? sem("primary") : border}`,
              background: checked ? sem("primary") : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontSize: fs.sm, color: fg }}>Accept terms and conditions</span>
          </button>

          <button
            onClick={() => setToggle(!toggle)}
            className="flex items-center gap-2.5 cursor-pointer"
            style={{ background: "transparent", border: "none", padding: 0 }}
          >
            <div style={{
              width: 40, height: 22, borderRadius: fullRadius,
              background: toggle ? sem("primary") : surface2,
              position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
              <motion.div
                animate={{ x: toggle ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                style={{ position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: shadowBase }}
              />
            </div>
            <span style={{ fontSize: fs.sm, color: fg }}>Enable notifications</span>
          </button>
        </div>
      </Section>

      <Section id="textarea" index={4} label="Textarea" fg={fg} fgMuted={fgMuted} accent={accent}>
        <textarea
          rows={3}
          placeholder="Write your message..."
          style={{ width: "100%", padding: "8px 10px", borderRadius: baseRadius, border: `${strokeBase} solid ${border}`, background: surface, color: fg, fontSize: fs.sm, resize: "none", outline: "none" }}
          readOnly
        />
      </Section>
    </div>
  )
}

// ─── Table Tab ────────────────────────────────────────────────────────────────
function TableTab(p: TabProps) {
  const { surface, surface2, border, fg, fgMuted, sem, baseRadius, strokeBase, fs } = p
  const rows = [
    { name: "Alice Johnson", role: "Designer",   status: "Active",   score: 98 },
    { name: "Bob Martinez",  role: "Engineer",   status: "Active",   score: 84 },
    { name: "Carol Lee",     role: "PM",         status: "Away",     score: 71 },
    { name: "David Chen",    role: "Engineer",   status: "Inactive", score: 55 },
    { name: "Eva Williams",  role: "Designer",   status: "Active",   score: 91 },
  ]
  const statusColor = (s: string) => s === "Active" ? sem("success") : s === "Away" ? sem("warning") : fgMuted
  // minmax(0,…) on the name col + ellipsis lets the row survive narrow widths.
  const cols = "minmax(0,1.4fr) minmax(48px,0.7fr) minmax(48px,0.55fr) 56px"
  const ellipsis: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }

  return (
    <div className="flex flex-col gap-4">
      <div style={{ background: surface, borderRadius: baseRadius, border: `${strokeBase} solid ${border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "10px 14px", borderBottom: `${strokeBase} solid ${border}`, background: surface2 }}>
          {["Name","Role","Status","Score"].map((h) => (
            <span key={h} style={{ fontSize: fs.xs, fontWeight: 600, color: fgMuted, textTransform: "uppercase", letterSpacing: "0.05em", ...ellipsis }}>{h}</span>
          ))}
        </div>
        {rows.map((row, i) => (
          <motion.div
            key={row.name}
            whileHover={{ background: sem("primary") + "08" }}
            style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "10px 14px", borderBottom: i < rows.length - 1 ? `${strokeBase} solid ${border}` : "none", alignItems: "center" }}
          >
            <span style={{ fontSize: fs.sm, fontWeight: 500, color: fg, ...ellipsis }}>{row.name}</span>
            <span style={{ fontSize: fs.xs, color: fgMuted, ...ellipsis }}>{row.role}</span>
            <span style={{ fontSize: fs.xs, fontWeight: 500, color: statusColor(row.status), ...ellipsis }}>{row.status}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
              <div style={{ flex: 1, height: 4, background: surface2, borderRadius: "9999px", overflow: "hidden", minWidth: 0 }}>
                <div style={{ width: `${row.score}%`, height: "100%", background: row.score > 80 ? sem("success") : row.score > 60 ? sem("warning") : sem("danger"), borderRadius: "9999px" }} />
              </div>
              <span style={{ fontSize: "10px", color: fgMuted, width: 20, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.score}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Navigation Tab ───────────────────────────────────────────────────────────
function NavigationTab(p: TabProps & { tokens: any }) {
  const { surface, surface2, border, fg, fgMuted, sem, accent, baseRadius, strokeBase, fs, tokens } = p
  const [activeNav, setActiveNav] = useState("Dashboard")
  const [activeBreadcrumb] = useState(["Home","Settings","Profile"])
  const navItems = ["Dashboard","Analytics","Projects","Team","Settings"]

  return (
    <div className="flex flex-col gap-7">
      <Section id="navbar" index={1} label="Navbar" fg={fg} fgMuted={fgMuted} accent={accent}>
        <div style={{ display: "flex", gap: 2, padding: "4px", background: surface, borderRadius: baseRadius, border: `${strokeBase} solid ${border}`, overflowX: "auto" }}
             className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              style={{
                padding: "6px 12px",
                borderRadius: baseRadius,
                border: "none",
                fontSize: fs.xs,
                fontWeight: 500,
                cursor: "pointer",
                background: activeNav === item ? sem("primary") : "transparent",
                color: activeNav === item ? "#fff" : fgMuted,
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >{item}</button>
          ))}
        </div>
      </Section>

      <Section id="tabs" index={2} label="Tabs" fg={fg} fgMuted={fgMuted} accent={accent}>
        <div style={{ borderBottom: `2px solid ${border}` }}>
          <div style={{ display: "flex", gap: 0 }}>
            {["Overview","Details","Activity"].map((tab) => (
              <button
                key={tab}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  background: "transparent",
                  fontSize: fs.sm,
                  fontWeight: tab === "Overview" ? 600 : 400,
                  color: tab === "Overview" ? sem("primary") : fgMuted,
                  cursor: "pointer",
                  borderBottom: tab === "Overview" ? `2px solid ${sem("primary")}` : "2px solid transparent",
                  marginBottom: -2,
                  transition: "all 0.15s",
                }}
              >{tab}</button>
            ))}
          </div>
        </div>
      </Section>

      <Section id="breadcrumb" index={3} label="Breadcrumb" fg={fg} fgMuted={fgMuted} accent={accent}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {activeBreadcrumb.map((crumb, i) => (
            <div key={crumb} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: fs.xs, color: i === activeBreadcrumb.length - 1 ? fg : sem("primary"), fontWeight: i === activeBreadcrumb.length - 1 ? 500 : 400, cursor: "pointer" }}>{crumb}</span>
              {i < activeBreadcrumb.length - 1 && <span style={{ color: fgMuted, fontSize: fs.xs }}>/</span>}
            </div>
          ))}
        </div>
      </Section>

      <Section id="sidebar" index={4} label="Sidebar" fg={fg} fgMuted={fgMuted} accent={accent}>
        <div style={{ background: surface, borderRadius: baseRadius, border: `${strokeBase} solid ${border}`, overflow: "hidden", width: "min(160px, 100%)" }}>
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "8px 12px",
                border: "none", borderLeft: `2px solid ${activeNav === item ? sem("primary") : "transparent"}`,
                background: activeNav === item ? sem("primary") + "12" : "transparent",
                color: activeNav === item ? sem("primary") : fgMuted,
                fontSize: fs.xs, fontWeight: activeNav === item ? 600 : 400,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: activeNav === item ? sem("primary") : fgMuted, flexShrink: 0 }} />
              {item}
            </button>
          ))}
        </div>
      </Section>

      <Section id="palette" index={5} label="Color Palettes" count={Math.min(3, tokens.colors.palettes.length)} fg={fg} fgMuted={fgMuted} accent={accent}>
        {tokens.colors.palettes.slice(0, 3).map((pp: any) => (
          <div key={pp.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: fgMuted, marginBottom: 4, letterSpacing: "0.02em" }}>{pp.name}</div>
            <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", height: 18 }}>
              {Object.values(pp.shades).map((c: any, i: number) => (
                <div key={i} style={{ flex: 1, background: c }} />
              ))}
            </div>
          </div>
        ))}
      </Section>
    </div>
  )
}

// ─── Accordion sub-component ──────────────────────────────────────────────────
function AccordionPreview({ surface, surface2, border, fg, fgMuted, baseRadius, strokeBase, fs }: any) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const items = [
    { title: "What are design tokens?", body: "Design tokens are atomic values — colors, spacing, typography — stored as named variables that drive your entire UI system." },
    { title: "How do CSS variables work?", body: "CSS custom properties (var(--name)) let you define reusable values that cascade through your stylesheet and update at runtime." },
    { title: "Can I export to Figma?", body: "Yes — use the Figma Tokens export format to sync your token values directly with your Figma design files via the Tokens Studio plugin." },
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ border: `${strokeBase} solid ${border}`, borderRadius: baseRadius, overflow: "hidden" }}>
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: surface, border: "none",
              fontSize: fs.xs, fontWeight: 500, color: fg, cursor: "pointer", textAlign: "left",
            }}
          >
            <span>{item.title}</span>
            <motion.svg
              animate={{ rotate: openIdx === i ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ flexShrink: 0, color: fgMuted }}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </button>
          <AnimatePresence initial={false}>
            {openIdx === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{
                  padding: "10px 14px",
                  borderTop: `${strokeBase} solid ${border}`,
                  background: surface2,
                  fontSize: fs.xs, color: fgMuted, lineHeight: 1.6,
                }}>
                  {item.body}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

// ─── Feedback Tab ─────────────────────────────────────────────────────────────
function FeedbackTab(p: TabProps) {
  const { surface, surface2, border, fg, fgMuted, sem, accent, baseRadius, fullRadius, shadowBase, strokeBase, fs } = p
  const [dismissed, setDismissed] = useState<string[]>([])

  const alerts = [
    { key: "info",    variant: "info"    as const, colorKey: "primary", icon: "i",  title: "Heads up!",  msg: "Here's something you should know about." },
    { key: "success", variant: "success" as const, colorKey: "success", icon: "✓", title: "Success!",   msg: "Your changes have been saved." },
    { key: "warning", variant: "warning" as const, colorKey: "warning", icon: "!",  title: "Warning",    msg: "This action cannot be easily undone." },
    { key: "error",   variant: "error"   as const, colorKey: "danger",  icon: "✕",  title: "Error",      msg: "Something went wrong. Please try again." },
  ]

  return (
    <div className="flex flex-col gap-7">
      <Section id="alerts" index={1} label="Alerts" count={4 - dismissed.length} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {alerts.filter((a) => !dismissed.includes(a.key)).map((a) => (
              <motion.div
                key={a.key}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: "hidden" }}
              >
                <CodePeek spec={alertCode(a.variant)}>
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 12px", borderRadius: baseRadius,
                    background: sem(a.colorKey) + "18",
                    border: `${strokeBase} solid ${sem(a.colorKey)}40`,
                  }}>
                    <span style={{
                      marginTop: 1, width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      background: sem(a.colorKey), color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700,
                    }}>{a.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: fs.xs, fontWeight: 600, color: sem(a.colorKey) }}>{a.title}</p>
                      <p style={{ margin: 0, fontSize: fs.xs, color: fg, opacity: 0.8, lineHeight: 1.5 }}>{a.msg}</p>
                    </div>
                    <button
                      onClick={() => setDismissed((prev) => [...prev, a.key])}
                      style={{ background: "transparent", border: "none", color: fgMuted, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}
                    >×</button>
                  </div>
                </CodePeek>
              </motion.div>
            ))}
          </AnimatePresence>
          {dismissed.length > 0 && (
            <button
              onClick={() => setDismissed([])}
              style={{ fontSize: fs.xs, color: sem("primary"), background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
            >↺ Reset alerts</button>
          )}
        </div>
      </Section>

      <Section id="toasts" index={2} label="Toast Notifications" count={3} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="flex flex-col gap-2">
          {([
            { variant: "success" as const, colorKey: "success", icon: "✓", msg: "Changes saved successfully." },
            { variant: "error"   as const, colorKey: "danger",  icon: "✕", msg: "Failed to connect. Retrying..." },
            { variant: "info"    as const, colorKey: "primary", icon: "i", msg: "New update available." },
          ]).map(({ variant, colorKey, icon, msg }) => (
            <CodePeek key={variant} spec={toastCode(variant)}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: baseRadius,
                background: surface, border: `${strokeBase} solid ${border}`,
                boxShadow: shadowBase,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: sem(colorKey) + "20", color: sem(colorKey),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700,
                }}>{icon}</span>
                <p style={{ flex: 1, margin: 0, fontSize: fs.xs, color: fg, lineHeight: 1.4 }}>{msg}</p>
                <span style={{ color: fgMuted, fontSize: 16, cursor: "pointer" }}>×</span>
              </div>
            </CodePeek>
          ))}
        </div>
      </Section>

      <Section id="progress" index={3} label="Progress" count={3} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="flex flex-col gap-3">
          {([
            { value: 25, label: "Uploading...",  colorKey: "primary" },
            { value: 62, label: "Processing",    colorKey: "warning" },
            { value: 91, label: "Almost done!",  colorKey: "success" },
          ] as const).map(({ value, label, colorKey }, idx) => (
            <CodePeek key={idx} spec={progressCode(value, label)}>
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: fs.xs, fontWeight: 500, color: fg }}>{label}</span>
                  <span style={{ fontSize: fs.xs, color: fgMuted, fontVariantNumeric: "tabular-nums" }}>{value}%</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: fullRadius, background: surface2, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.9, delay: idx * 0.15, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: fullRadius, background: sem(colorKey) }}
                  />
                </div>
              </div>
            </CodePeek>
          ))}
        </div>
      </Section>

      <Section id="loading" index={4} label="Loading States" count={3} fg={fg} fgMuted={fgMuted} accent={accent}>
        <div className="flex items-start gap-8 flex-wrap">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              style={{
                width: 26, height: 26, borderRadius: "50%",
                border: `2.5px solid ${surface2}`,
                borderTopColor: sem("primary"),
              }}
            />
            <span style={{ fontSize: fs.xs, color: fgMuted }}>Spinner</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center", height: 26 }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  style={{ width: 7, height: 7, borderRadius: "50%", background: sem("primary") }}
                />
              ))}
            </div>
            <span style={{ fontSize: fs.xs, color: fgMuted }}>Dots</span>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 6 }}>
              {[85, 65, 45].map((w, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.35, 0.75, 0.35] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
                  style={{ width: `${w}%`, height: 8, borderRadius: fullRadius, background: surface2 }}
                />
              ))}
            </div>
            <span style={{ fontSize: fs.xs, color: fgMuted }}>Skeleton</span>
          </div>
        </div>
      </Section>
    </div>
  )
}
