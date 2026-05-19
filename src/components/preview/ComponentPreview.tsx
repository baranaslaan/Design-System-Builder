"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTokensStore } from "@/store/tokens"

type PreviewTab = "components" | "forms" | "table" | "navigation"

const PREVIEW_TABS: { key: PreviewTab; label: string }[] = [
  { key: "components", label: "Components" },
  { key: "forms",      label: "Forms" },
  { key: "table",      label: "Table" },
  { key: "navigation", label: "Nav" },
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
        className="flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: border, background: surface }}
      >
        {/* Tab switcher */}
        <div className="flex gap-0.5 flex-1">
          {PREVIEW_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: activeTab === t.key ? sem("primary") + "20" : "transparent",
                color: activeTab === t.key ? sem("primary") : fgMuted,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
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
      <div className="flex-1 overflow-y-auto p-4">
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
          {[
            { bg: sem("primary"), color: "#fff", label: "Primary" },
            { bg: sem("success"), color: "#fff", label: "Success" },
            { bg: sem("danger"),  color: "#fff", label: "Danger" },
            { bg: "transparent",  color: fg, label: "Outline", border: `${strokeBase} solid ${border}` },
          ].map(({ bg: btnBg, color, label, border: b }) => (
            <motion.button key={label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ background: btnBg, color, borderRadius: baseRadius, border: b, padding: "6px 16px", fontSize: fs.sm, fontWeight: 500, cursor: "pointer", boxShadow: shadowBase }}
            >{label}</motion.button>
          ))}
        </div>
      </Section>

      {/* Badges */}
      <Section label="Badges" fg={fg} fgMuted={fgMuted}>
        <div className="flex flex-wrap gap-2">
          {[["primary","Primary"],["success","Success"],["danger","Error"],["warning","Warning"]].map(([id, label]) => (
            <span key={id} style={{ background: sem(id) + "20", color: sem(id), borderRadius: fullRadius, padding: "3px 10px", fontSize: fs.xs, fontWeight: 500 }}>{label}</span>
          ))}
        </div>
      </Section>

      {/* Cards */}
      <Section label="Cards" fg={fg} fgMuted={fgMuted}>
        <div className="grid grid-cols-2 gap-3">
          <div style={{ background: surface, borderRadius: xlRadius, padding: 16, boxShadow: shadowLg, border: `${strokeBase} solid ${border}` }}>
            <div style={{ width: 32, height: 32, borderRadius: baseRadius, background: sem("primary") + "20", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: sem("primary") }} />
            </div>
            <div style={{ fontSize: fs.sm, fontWeight: 600, color: fg, marginBottom: 4 }}>Elevated Card</div>
            <div style={{ fontSize: fs.xs, color: fgMuted, lineHeight: 1.5 }}>Uses radius, shadow and stroke tokens.</div>
          </div>
          <div style={{ background: `linear-gradient(135deg, ${sem("primary")}15, ${sem("info")}10)`, borderRadius: xlRadius, padding: 16, border: `${strokeBase} solid ${sem("primary")}30` }}>
            <div style={{ fontSize: fs.xs, color: sem("primary"), fontWeight: 600, marginBottom: 6 }}>FEATURED</div>
            <div style={{ fontSize: fs.sm, fontWeight: 700, color: fg, marginBottom: 4 }}>Token Card</div>
            <div style={{ fontSize: fs.xs, color: fgMuted, lineHeight: 1.5 }}>Semantic + palette colors.</div>
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
          {[
            { label: "Default", placeholder: "Enter text...", state: "default" },
            { label: "Focus", placeholder: "Focused input", state: "focus" },
            { label: "Error", placeholder: "Invalid value", state: "error" },
            { label: "Disabled", placeholder: "Disabled", state: "disabled" },
          ].map(({ label, placeholder, state }) => (
            <div key={label} className="flex flex-col gap-1">
              <label style={{ fontSize: fs.xs, fontWeight: 500, color: fgMuted }}>{label}</label>
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

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ label, fg, fgMuted, children }: { label: string; fg: string; fgMuted: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: "10px", fontWeight: 600, color: fgMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</p>
      {children}
    </div>
  )
}
