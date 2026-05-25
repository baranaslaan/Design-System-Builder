"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import * as Dialog from "@radix-ui/react-dialog"
import * as Tabs from "@radix-ui/react-tabs"
import { X, Settings, User, Bell, Palette, Puzzle } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { useTokensStore } from "@/store/tokens"
import { useT } from "@/lib/i18n"
import { FigmaSyncPanel } from "@/components/sync/FigmaSyncPanel"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const t = useT()
  const { user, profile, updateProfile } = useAuthStore()
  const { appTheme, setAppTheme, language, setLanguage } = useTokensStore()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProfileSave = async () => {
    setSaving(true); setError(null)
    const err = await updateProfile({ display_name: displayName.trim() || null, avatar_url: avatarUrl.trim() || null })
    setSaving(false)
    if (err) { setError(err); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const initials = (profile?.display_name ?? user?.email ?? "?").slice(0, 2).toUpperCase()

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl focus:outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            style={{ minWidth: 750, minHeight: 550 }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-[var(--border)] flex items-center gap-3 flex-shrink-0">
              <Settings size={16} className="text-[var(--accent)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-sm font-semibold text-[var(--foreground)]">
                  {t("settings_title")}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[var(--muted)] mt-0.5">
                  {t("settings_subtitle")}
                </Dialog.Description>
              </div>
              <Dialog.Close className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors">
                <X size={14} />
              </Dialog.Close>
            </div>

            <Tabs.Root defaultValue="profile" className="flex flex-1 min-h-0">
              {/* Sidebar nav */}
              <Tabs.List className="flex flex-col gap-0.5 p-3 border-r border-[var(--border)] w-36 flex-shrink-0">
                {[
                  { value: "profile", icon: <User size={13} />, label: t("settings_tab_profile") },
                  { value: "appearance", icon: <Palette size={13} />, label: t("settings_tab_appearance") },
                  { value: "integrations", icon: <Puzzle size={13} />, label: t("settings_tab_integrations") },
                  { value: "notifications", icon: <Bell size={13} />, label: t("settings_tab_notifications") },
                ].map((item) => (
                  <Tabs.Trigger
                    key={item.value}
                    value={item.value}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors text-[var(--muted)] data-[state=active]:bg-[var(--surface-2)] data-[state=active]:text-[var(--foreground)]"
                  >
                    {item.icon}
                    {item.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              <div className="flex-1 overflow-y-auto">
                {/* Profile tab */}
                <Tabs.Content value="profile" className="p-5 space-y-5">
                  {/* Avatar preview */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 overflow-hidden"
                      style={{ background: avatarUrl ? "transparent" : "var(--accent)" }}
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {profile?.display_name ?? t("settings_no_name")}
                      </p>
                      <p className="text-xs text-[var(--muted)] truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                        {t("settings_display_name")}
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={t("settings_display_name_placeholder")}
                        className="w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                        {t("settings_avatar_url")}
                      </label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors"
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-red-400">{error}</p>}

                  <button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-all"
                    style={{ background: saved ? "#22c55e" : "var(--accent)" }}
                  >
                    {saved ? t("settings_saved") : saving ? t("auth_loading") : t("settings_btn_save")}
                  </button>
                </Tabs.Content>

                {/* Appearance tab */}
                <Tabs.Content value="appearance" className="p-5 space-y-1">
                  <SettingsRow
                    title={t("settings_theme")}
                    description={t("settings_theme_desc")}
                  >
                    <PillToggle
                      options={[
                        { value: "dark",  label: t("settings_theme_dark") },
                        { value: "light", label: t("settings_theme_light") },
                      ]}
                      value={appTheme}
                      onChange={(v) => setAppTheme(v as "dark" | "light")}
                    />
                  </SettingsRow>

                  <div className="h-px bg-[var(--border)]" />

                  <SettingsRow
                    title={t("settings_language")}
                    description={t("settings_language_desc")}
                  >
                    <PillToggle
                      options={[
                        { value: "en", label: "English" },
                        { value: "tr", label: "Türkçe" },
                      ]}
                      value={language}
                      onChange={(v) => setLanguage(v as "en" | "tr")}
                    />
                  </SettingsRow>
                </Tabs.Content>

                {/* Integrations tab */}
                <Tabs.Content value="integrations" className="p-5 space-y-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-[var(--foreground)]">{t("settings_figma_title")}</p>
                    <p className="text-xs text-[var(--muted)]">{t("settings_figma_desc")}</p>
                  </div>
                  <FigmaSyncPanel />
                </Tabs.Content>

                {/* Notifications tab */}
                <Tabs.Content value="notifications" className="p-5">
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--muted)]">
                    <Bell size={24} className="opacity-30" />
                    <p className="text-sm">{t("settings_notifications_soon")}</p>
                  </div>
                </Tabs.Content>
              </div>
            </Tabs.Root>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SettingsRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </div>
      {children}
    </div>
  )
}

function PillToggle({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative flex items-center h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] p-0.5 gap-0 flex-shrink-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="relative px-4 h-full text-xs font-medium rounded-md transition-colors z-10 min-w-[80px]"
          style={{ color: value === opt.value ? "var(--foreground)" : "var(--muted)" }}
        >
          {value === opt.value && (
            <motion.div
              layoutId="pill-toggle-active"
              className="absolute inset-0 bg-[var(--background)] rounded-md border border-[var(--border)] shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
