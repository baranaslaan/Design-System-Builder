"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cloud, Settings, LogOut, LogIn } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { AuthModal } from "./AuthModal"
import { CloudSetsModal } from "./CloudSetsModal"
import { SettingsModal } from "./SettingsModal"
import { useT } from "@/lib/i18n"

export function ProfileDropdown() {
  const t = useT()
  const { user, profile, signOut } = useAuthStore()
  const [authOpen, setAuthOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [cloudOpen, setCloudOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "User"
  const initials = displayName.slice(0, 2).toUpperCase()

  if (!user) {
    return (
      <>
        <button
          onClick={() => setAuthOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] transition-colors"
        >
          <LogIn size={13} />
          {t("auth_btn_signin")}
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    )
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((p) => !p)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden hover:ring-2 hover:ring-[var(--accent)] hover:ring-offset-1 hover:ring-offset-[var(--background)] transition-all"
          style={{ background: profile?.avatar_url ? "transparent" : "var(--accent)" }}
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute right-0 top-full mt-1.5 w-52 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden py-1"
              >
                {/* User info */}
                <div className="px-3 py-2.5 border-b border-[var(--border)] mb-1">
                  <p className="text-xs font-semibold text-[var(--foreground)] truncate">{displayName}</p>
                  <p className="text-[10px] text-[var(--muted)] truncate">{user.email}</p>
                </div>

                {[
                  {
                    icon: <Cloud size={13} />,
                    label: t("profile_menu_cloud"),
                    onClick: () => { setDropdownOpen(false); setCloudOpen(true) },
                  },
                  {
                    icon: <Settings size={13} />,
                    label: t("profile_menu_settings"),
                    onClick: () => { setDropdownOpen(false); setSettingsOpen(true) },
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <span className="text-[var(--muted)]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}

                <div className="h-px bg-[var(--border)] my-1" />

                <button
                  onClick={() => { setDropdownOpen(false); signOut() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={13} />
                  {t("profile_menu_signout")}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <CloudSetsModal open={cloudOpen} onClose={() => setCloudOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
