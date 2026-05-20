"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Monitor } from "lucide-react"
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

export function ComponentPreview() {
  const { tokens, previewMode, setPreviewMode } = useTokensStore()
  const [activeTab, setActiveTab] = useState<PreviewTab>("components")
  const { colors, typography, radius, stroke, shadows } = tokens

  const isDark = previewMode === "dark"

  // Mode-aware semantic color resolver
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

  return (
    <div className="flex flex-col h-full" style={{ background: bg, fontFamily: ff }}>
      {/* Preview toolbar */}
      <div
        className="flex items-stretch gap-2 px-4 py-2.5 border-b flex-shrink-0 min-w-0"
        style={{ borderColor: border, background: surface }}
      >
        {/* Tab switcher — horizontal scroll when squeezed */}
        <div
          className="flex gap-0.5 flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
          }}
        >
          {PREVIEW_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all flex-shrink-0"
              style={{
                background: activeTab === t.key ? sem("primary") + "20" : "transparent",
                color: activeTab === t.key ? sem("primary") : fgMuted,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Mode toggle — sticky right, never shrinks */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg flex-shrink-0"
          style={{ background: surface2 }}
        >
          {([["light", Sun], ["dark", Moon]] as const).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className="flex items-center justify-center w-6 h-6 rounded-md transition-all"
              style={{
                background: previewMode === mode ? (isDark ? "#3f3f46" : "#fff") : "transparent",
                color: previewMode === mode ? fg : fgMuted,
                boxShadow: previewMode === mode ? shadowBase : "none",
              }}
            >
              <Icon size={12} />
            </button>
          ))}
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto overflow-x-clip p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + previewMode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "components" && (
              <ComponentsTab {...{ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, xlRadius, fullRadius, shadowBase, shadowLg, strokeBase, fs }} />
            )}
            {activeTab === "forms" && (
              <FormsTab {...{ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, xlRadius, fullRadius, shadowBase, strokeBase, fs }} />
            )}
            {activeTab === "table" && (
              <TableTab {...{ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, strokeBase, fs }} />
            )}
            {activeTab === "navigation" && (
              <NavigationTab {...{ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, fullRadius, shadowBase, strokeBase, fs, tokens }} />
            )}
            {activeTab === "feedback" && (
              <FeedbackTab {...{ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, xlRadius, fullRadius, shadowBase, shadowLg, strokeBase, fs }} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Components Tab ───────────────────────────────────────────────────────────
function ComponentsTab({ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, xlRadius, fullRadius, shadowBase, shadowLg, strokeBase, fs }: any) {
  return (
    <div className="flex flex-col gap-6">
      {/* Typography */}
      <Section label="Typography" fg={fg} fgMuted={fgMuted}>
        {[{ size: fs["4xl"], w: 700, text: "Display" }, { size: fs["2xl"], w: 600, text: "Heading" }, { size: fs.lg, w: 500, text: "Subheading" }, { size: fs.base, w: 400, text: "Body text" }, { size: fs.sm, w: 400, text: "Small" }, { size: fs.xs, w: 400, text: "Caption" }].map(({ size, w, text }) => (
          <div key={text} style={{ fontSize: size, fontWeight: w, color: fg, lineHeight: 1.3 }}>{text}</div>
        ))}
      </Section>

      {/* Buttons */}
      <Section label="Buttons" fg={fg} fgMuted={fgMuted}>
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

      {/* Badges */}
      <Section label="Badges" fg={fg} fgMuted={fgMuted}>
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

      {/* Cards */}
      <Section label="Cards" fg={fg} fgMuted={fgMuted}>
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
          <div style={{ background: `linear-gradient(135deg, ${sem("primary")}15, ${sem("info")}10)`, borderRadius: xlRadius, padding: 16, border: `${strokeBase} solid ${sem("primary")}30` }}>
            <div style={{ fontSize: fs.xs, color: sem("primary"), fontWeight: 600, marginBottom: 6 }}>FEATURED</div>
            <div style={{ fontSize: fs.sm, fontWeight: 700, color: fg, marginBottom: 4 }}>Token Card</div>
            <div style={{ fontSize: fs.xs, color: fgMuted, lineHeight: 1.5 }}>Semantic + palette colors.</div>
          </div>
        </div>
      </Section>

      {/* Accordion */}
      <Section label="Accordion" fg={fg} fgMuted={fgMuted}>
        <CodePeek spec={accordionCode()}>
          <AccordionPreview {...{ surface, surface2, border, fg, fgMuted, baseRadius, strokeBase, fs }} />
        </CodePeek>
      </Section>

      {/* Avatar Group */}
      <Section label="Avatars" fg={fg} fgMuted={fgMuted}>
        <div className="flex items-center justify-between">
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
function FormsTab({ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, xlRadius, fullRadius, shadowBase, strokeBase, fs }: any) {
  const [checked, setChecked] = useState(false)
  const [toggle, setToggle] = useState(true)
  const [selected, setSelected] = useState("option1")

  return (
    <div className="flex flex-col gap-5">
      {/* Text inputs */}
      <Section label="Text Inputs" fg={fg} fgMuted={fgMuted}>
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

      {/* Select */}
      <Section label="Select" fg={fg} fgMuted={fgMuted}>
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

      {/* Checkbox & Toggle */}
      <Section label="Controls" fg={fg} fgMuted={fgMuted}>
        <div className="flex flex-col gap-3">
          {/* Checkbox */}
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

          {/* Toggle */}
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

      {/* Textarea */}
      <Section label="Textarea" fg={fg} fgMuted={fgMuted}>
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
function TableTab({ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, strokeBase, fs }: any) {
  const rows = [
    { name: "Alice Johnson", role: "Designer",   status: "Active",   score: 98 },
    { name: "Bob Martinez",  role: "Engineer",   status: "Active",   score: 84 },
    { name: "Carol Lee",     role: "PM",         status: "Away",     score: 71 },
    { name: "David Chen",    role: "Engineer",   status: "Inactive", score: 55 },
    { name: "Eva Williams",  role: "Designer",   status: "Active",   score: 91 },
  ]

  const statusColor = (s: string) => s === "Active" ? sem("success") : s === "Away" ? sem("warning") : fgMuted

  return (
    <div className="flex flex-col gap-4">
      <div style={{ background: surface, borderRadius: baseRadius, border: `${strokeBase} solid ${border}`, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 50px", gap: 8, padding: "10px 14px", borderBottom: `${strokeBase} solid ${border}`, background: surface2 }}>
          {["Name","Role","Status","Score"].map((h) => (
            <span key={h} style={{ fontSize: fs.xs, fontWeight: 600, color: fgMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        {rows.map((row, i) => (
          <motion.div
            key={row.name}
            whileHover={{ background: sem("primary") + "08" }}
            style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 50px", gap: 8, padding: "10px 14px", borderBottom: i < rows.length - 1 ? `${strokeBase} solid ${border}` : "none", alignItems: "center" }}
          >
            <span style={{ fontSize: fs.sm, fontWeight: 500, color: fg }}>{row.name}</span>
            <span style={{ fontSize: fs.xs, color: fgMuted }}>{row.role}</span>
            <span style={{ fontSize: fs.xs, fontWeight: 500, color: statusColor(row.status) }}>{row.status}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ flex: 1, height: 4, background: surface2, borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: `${row.score}%`, height: "100%", background: row.score > 80 ? sem("success") : row.score > 60 ? sem("warning") : sem("danger"), borderRadius: "9999px" }} />
              </div>
              <span style={{ fontSize: "10px", color: fgMuted, width: 24, textAlign: "right" }}>{row.score}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Navigation Tab ───────────────────────────────────────────────────────────
function NavigationTab({ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, fullRadius, shadowBase, strokeBase, fs, tokens }: any) {
  const [activeNav, setActiveNav] = useState("Dashboard")
  const [activeBreadcrumb] = useState(["Home","Settings","Profile"])
  const navItems = ["Dashboard","Analytics","Projects","Team","Settings"]

  return (
    <div className="flex flex-col gap-6">
      {/* Horizontal navbar */}
      <Section label="Navbar" fg={fg} fgMuted={fgMuted}>
        <div style={{ display: "flex", gap: 2, padding: "4px", background: surface, borderRadius: baseRadius, border: `${strokeBase} solid ${border}` }}>
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
              }}
            >{item}</button>
          ))}
        </div>
      </Section>

      {/* Tabs */}
      <Section label="Tabs" fg={fg} fgMuted={fgMuted}>
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

      {/* Breadcrumb */}
      <Section label="Breadcrumb" fg={fg} fgMuted={fgMuted}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {activeBreadcrumb.map((crumb, i) => (
            <div key={crumb} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: fs.xs, color: i === activeBreadcrumb.length - 1 ? fg : sem("primary"), fontWeight: i === activeBreadcrumb.length - 1 ? 500 : 400, cursor: "pointer" }}>{crumb}</span>
              {i < activeBreadcrumb.length - 1 && <span style={{ color: fgMuted, fontSize: fs.xs }}>/</span>}
            </div>
          ))}
        </div>
      </Section>

      {/* Sidebar mini */}
      <Section label="Sidebar" fg={fg} fgMuted={fgMuted}>
        <div style={{ background: surface, borderRadius: baseRadius, border: `${strokeBase} solid ${border}`, overflow: "hidden", width: 160 }}>
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

      {/* Color palette preview */}
      <Section label="Color Palettes" fg={fg} fgMuted={fgMuted}>
        {tokens.colors.palettes.slice(0, 3).map((p: any) => (
          <div key={p.id} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: "10px", color: fgMuted, marginBottom: 3 }}>{p.name}</div>
            <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", height: 18 }}>
              {Object.values(p.shades).map((c: any, i: number) => (
                <div key={i} style={{ flex: 1, background: c }} />
              ))}
            </div>
          </div>
        ))}
      </Section>
    </div>
  )
}

// ─── Accordion sub-component (needs its own state) ───────────────────────────
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
function FeedbackTab({ bg, surface, surface2, border, fg, fgMuted, sem, baseRadius, xlRadius, fullRadius, shadowBase, shadowLg, strokeBase, fs }: any) {
  const [dismissed, setDismissed] = useState<string[]>([])

  const alerts = [
    { key: "info",    variant: "info"    as const, colorKey: "primary", icon: "i",  title: "Heads up!",  msg: "Here's something you should know about." },
    { key: "success", variant: "success" as const, colorKey: "success", icon: "✓", title: "Success!",   msg: "Your changes have been saved." },
    { key: "warning", variant: "warning" as const, colorKey: "warning", icon: "!",  title: "Warning",    msg: "This action cannot be easily undone." },
    { key: "error",   variant: "error"   as const, colorKey: "danger",  icon: "✕",  title: "Error",      msg: "Something went wrong. Please try again." },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* Alerts */}
      <Section label="Alerts" fg={fg} fgMuted={fgMuted}>
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

      {/* Toast Notifications */}
      <Section label="Toast Notifications" fg={fg} fgMuted={fgMuted}>
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

      {/* Progress Bars */}
      <Section label="Progress" fg={fg} fgMuted={fgMuted}>
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
                  <span style={{ fontSize: fs.xs, color: fgMuted }}>{value}%</span>
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

      {/* Loading States */}
      <Section label="Loading States" fg={fg} fgMuted={fgMuted}>
        <div className="flex items-start gap-8">
          {/* Spinner */}
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
          {/* Bouncing dots */}
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
          {/* Skeleton */}
          <div style={{ flex: 1 }}>
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

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ label, fg, fgMuted, children }: { label: string; fg: string; fgMuted: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: "10px", fontWeight: 600, color: fgMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</p>
      {children}
    </div>
  )
}
