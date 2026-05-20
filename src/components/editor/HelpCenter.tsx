"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Sparkles, Keyboard, Lightbulb, Rocket, ArrowRight, ArrowLeft,
  Palette, Type, Layers, Download, GitCompare, History, Search,
  Undo2, Sun, Eye, Save, Move, Edit3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useT, type StringKey } from "@/lib/i18n"

type TabKey = "tour" | "features" | "shortcuts" | "tips"

const TABS: { key: TabKey; labelKey: StringKey; icon: React.ReactNode }[] = [
  { key: "tour",      labelKey: "help_tab_tour",      icon: <Rocket size={13} /> },
  { key: "features",  labelKey: "help_tab_features",  icon: <Sparkles size={13} /> },
  { key: "shortcuts", labelKey: "help_tab_shortcuts", icon: <Keyboard size={13} /> },
  { key: "tips",      labelKey: "help_tab_tips",      icon: <Lightbulb size={13} /> },
]

// ── Tour steps ──────────────────────────────────────────────────────────────
const TOUR_STEPS: { titleKey: StringKey; descKey: StringKey; icon: React.ReactNode; color: string }[] = [
  { titleKey: "tour_step1_title", descKey: "tour_step1_desc", icon: <Sparkles size={28} />, color: "var(--accent)" },
  { titleKey: "tour_step2_title", descKey: "tour_step2_desc", icon: <Layers size={28} />,    color: "#6366f1" },
  { titleKey: "tour_step3_title", descKey: "tour_step3_desc", icon: <Eye size={28} />,        color: "#10b981" },
  { titleKey: "tour_step4_title", descKey: "tour_step4_desc", icon: <Download size={28} />,   color: "#f59e0b" },
  { titleKey: "tour_step5_title", descKey: "tour_step5_desc", icon: <Rocket size={28} />,     color: "var(--accent)" },
]

// ── Features list ────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: <Palette size={14} />, name: "Color Palettes", desc: "Tailwind-style 11 shade palette üret. Base renkten otomatik shade generation." },
  { icon: <Type size={14} />,    name: "Typography",     desc: "Google Fonts entegrasyonu, type scale visualization, font size/weight/line-height token'ları." },
  { icon: <Layers size={14} />,  name: "Semantic Colors", desc: "Light/dark dual value, alias referansları (örn. violet.600 → primary), WCAG contrast badge." },
  { icon: <Save size={14} />,    name: "Custom Presets",  desc: "Mevcut token setini preset olarak kaydet. Cihazlar arası taşı (JSON export/import)." },
  { icon: <GitCompare size={14} />, name: "Token Diff",   desc: "İki preset/snapshot arasında fark karşılaştırması — added/removed/changed renk swatch'larıyla." },
  { icon: <History size={14} />, name: "History",         desc: "Otomatik snapshot, manuel save, herhangi bir versiyona restore." },
  { icon: <Undo2 size={14} />,   name: "Undo/Redo",       desc: "40 adıma kadar geri/ileri al. Cmd+Z desteği." },
  { icon: <Edit3 size={14} />,   name: "Token Rename",    desc: "Spacing/radius/stroke key'lerini inline rename et — Pencil ikonuna tıkla." },
  { icon: <Move size={14} />,    name: "Resizable Preview", desc: "Preview paneli sürüklenebilir kenarla istediğin genişliğe getir." },
  { icon: <Search size={14} />,  name: "Cmd+K Search",    desc: "Tüm token'lar üzerinde global arama, kategori filtresi, klavye navigasyonu." },
]

// ── Shortcuts ────────────────────────────────────────────────────────────────
const SHORTCUTS = [
  { keys: ["⌘", "K"],         action: "Token arama (command palette)" },
  { keys: ["⌘", "Z"],         action: "Geri al (undo)" },
  { keys: ["⌘", "⇧", "Z"],   action: "İleri al (redo)" },
  { keys: ["⌘", "Y"],         action: "İleri al (alternatif)" },
  { keys: ["Esc"],            action: "Modal/dropdown kapat" },
  { keys: ["Enter"],          action: "Rename/edit kaydet" },
  { keys: ["Tab"],            action: "Sonraki alan" },
  { keys: ["?"],              action: "Bu yardım merkezini aç" },
]

// ── Tips ─────────────────────────────────────────────────────────────────────
const TIPS = [
  {
    icon: <Edit3 size={14} />,
    title: "Inline rename",
    text: "Spacing, radius veya stroke panelinde key'in üzerine gel, kalem ikonu çıkacak. Tıkla, yeni isim yaz, Enter'a bas. Tüm referanslar otomatik güncellenir.",
  },
  {
    icon: <Palette size={14} />,
    title: "Hızlı palette üretimi",
    text: "Colors > Palettes'te bir palette'in başında renk seçiciye tıkla. Base renkten 50–950 arası 11 shade otomatik üretilir.",
  },
  {
    icon: <GitCompare size={14} />,
    title: "Preset karşılaştırma",
    text: "History panelinde 'Compare Against' dropdown'undan başka bir preset seç (Material 3, Tailwind, vb.). Sonra herhangi bir snapshot'a 'Diff' bas — kategori bazlı fark listesi açılır.",
  },
  {
    icon: <Move size={14} />,
    title: "Preview boyutu",
    text: "Preview paneli ile editor arasındaki çizgiyi sürükle. Genişlettiğin değer hatırlanır. Breakpoint butonuna tıklarsan default'a döner.",
  },
  {
    icon: <Sun size={14} />,
    title: "App ve Preview temaları ayrı",
    text: "Topbar'daki güneş/ay ikonu uygulamanın kendi temasını değiştirir. Preview içindeki ikon ise dışa aktarılacak token setinin light/dark modunu test eder.",
  },
  {
    icon: <Save size={14} />,
    title: "Manuel snapshot",
    text: "Önemli bir değişiklik yapmadan önce History > 'Save snapshot' ile manuel checkpoint at. İstersen sonra restore edebilirsin.",
  },
  {
    icon: <Download size={14} />,
    title: "Section bazlı export",
    text: "Export modalında CSS/SCSS seçerken section pill'lerinden sadece belirli bir kategoriyi dışa aktarabilirsin (örn. sadece colors).",
  },
  {
    icon: <Type size={14} />,
    title: "Google Fonts seç",
    text: "Typography > Font Families'te font ismine tıkla — 65+ Google Font arasından canlı preview ile seçim yapabilirsin.",
  },
]

// ── Components ───────────────────────────────────────────────────────────────
function TourPanel({ onDone }: { onDone: () => void }) {
  const t = useT()
  const [step, setStep] = useState(0)
  const total = TOUR_STEPS.length
  const cur = TOUR_STEPS[step]

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 text-center">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-5"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `${cur.color}20`, color: cur.color }}
          >
            {cur.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{t(cur.titleKey)}</h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md">{t(cur.descKey)}</p>
          </div>
        </motion.div>
      </div>

      {/* Footer with progress */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? 20 : 6,
                background: i === step ? "var(--accent)" : "var(--surface-3)",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="gap-1"
          >
            <ArrowLeft size={12} /> {t("help_prev")}
          </Button>
          {step < total - 1 ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} className="gap-1">
              {t("help_next")} <ArrowRight size={12} />
            </Button>
          ) : (
            <Button size="sm" onClick={onDone} className="gap-1">
              {t("help_start")} <Rocket size={12} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function FeaturesPanel() {
  return (
    <div className="px-5 py-4 grid grid-cols-2 gap-3 overflow-y-auto">
      {FEATURES.map((f) => (
        <motion.div
          key={f.name}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          className="bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center">
              {f.icon}
            </div>
            <span className="text-xs font-semibold text-[var(--foreground)]">{f.name}</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}

function ShortcutsPanel() {
  return (
    <div className="px-5 py-4 overflow-y-auto">
      <div className="flex flex-col gap-1.5">
        {SHORTCUTS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          >
            <span className="text-sm text-[var(--foreground)]">{s.action}</span>
            <div className="flex items-center gap-1">
              {s.keys.map((k, ki) => (
                <kbd
                  key={ki}
                  className="px-1.5 py-0.5 rounded-md bg-[var(--surface-3)] border border-[var(--border)] text-[10px] font-mono text-[var(--foreground)] min-w-[20px] text-center"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function TipsPanel() {
  return (
    <div className="px-5 py-4 flex flex-col gap-2 overflow-y-auto">
      {TIPS.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
            {t.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[var(--foreground)] mb-1">{t.title}</div>
            <div className="text-[11px] text-[var(--muted)] leading-relaxed">{t.text}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface HelpCenterProps {
  open: boolean
  onClose: () => void
  initialTab?: TabKey
}

export function HelpCenter({ open, onClose, initialTab = "tour" }: HelpCenterProps) {
  const t = useT()
  const [tab, setTab] = useState<TabKey>(initialTab)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-4 top-8 bottom-8 z-50 max-w-3xl mx-auto flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[var(--foreground)]">{t("help_title")}</div>
                <div className="text-[11px] text-[var(--muted)]">{t("help_subtitle")}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X size={14} />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border)] flex-shrink-0">
              {TABS.map((tt) => (
                <button
                  key={tt.key}
                  onClick={() => setTab(tt.key)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    color: tab === tt.key ? "var(--foreground)" : "var(--muted)",
                  }}
                >
                  {tab === tt.key && (
                    <motion.div
                      layoutId="help-tab"
                      className="absolute inset-0 bg-[var(--surface-2)] rounded-md"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tt.icon}
                    {t(tt.labelKey)}
                  </span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {tab === "tour" && <TourPanel onDone={onClose} />}
                  {tab === "features" && <FeaturesPanel />}
                  {tab === "shortcuts" && <ShortcutsPanel />}
                  {tab === "tips" && <TipsPanel />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
