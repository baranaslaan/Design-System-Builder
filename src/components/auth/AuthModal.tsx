"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Mail, Lock, User, Sparkles } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { useT } from "@/lib/i18n"

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

type Tab = "login" | "signup"

export function AuthModal({ open, onClose }: AuthModalProps) {
  const t = useT()
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuthStore()
  const [tab, setTab] = useState<Tab>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const reset = () => {
    setEmail(""); setPassword(""); setDisplayName(""); setError(null); setLoading(false); setSuccess(false)
  }

  const handleTabChange = (next: Tab) => {
    setTab(next); reset()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    let err: string | null = null
    if (tab === "login") {
      err = await signInWithEmail(email, password)
    } else {
      if (!displayName.trim()) { setError(t("auth_error_name_required")); setLoading(false); return }
      err = await signUpWithEmail(email, password, displayName.trim())
      if (!err) { setSuccess(true); setLoading(false); return }
    }
    setLoading(false)
    if (err) setError(err)
    else onClose()
  }

  const handleGoogle = async () => {
    setError(null)
    const err = await signInWithGoogle()
    if (err) setError(err)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md focus:outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent)" }}>
                <Sparkles size={14} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-sm font-semibold text-[var(--foreground)]">
                  {tab === "login" ? t("auth_login_title") : t("auth_signup_title")}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[var(--muted)] mt-0.5">
                  {tab === "login" ? t("auth_login_subtitle") : t("auth_signup_subtitle")}
                </Dialog.Description>
              </div>
              <Dialog.Close className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors">
                <X size={14} />
              </Dialog.Close>
            </div>

            <div className="p-6">
              {/* Tab switcher */}
              <div className="flex bg-[var(--surface-2)] rounded-lg p-0.5 mb-5">
                {(["login", "signup"] as Tab[]).map((t_) => (
                  <button
                    key={t_}
                    onClick={() => handleTabChange(t_)}
                    className="relative flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
                    style={{ color: tab === t_ ? "var(--foreground)" : "var(--muted)" }}
                  >
                    {tab === t_ && (
                      <motion.div
                        layoutId="auth-tab-bg"
                        className="absolute inset-0 bg-[var(--background)] rounded-md border border-[var(--border)] shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">
                      {t_ === "login" ? t("auth_tab_login") : t("auth_tab_signup")}
                    </span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-6 space-y-2"
                  >
                    <div className="text-2xl">📬</div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{t("auth_check_email")}</p>
                    <p className="text-xs text-[var(--muted)]">{t("auth_check_email_desc")}</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key={tab}
                    initial={{ opacity: 0, x: tab === "signup" ? 12 : -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: tab === "signup" ? -12 : 12 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleSubmit}
                    className="space-y-3"
                  >
                    {tab === "signup" && (
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                        <input
                          type="text"
                          placeholder={t("auth_placeholder_name")}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors"
                        />
                      </div>
                    )}

                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                      <input
                        type="email"
                        placeholder={t("auth_placeholder_email")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors"
                      />
                    </div>

                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                      <input
                        type="password"
                        placeholder={t("auth_placeholder_password")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors"
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                      style={{ background: "var(--accent)" }}
                    >
                      {loading
                        ? t("auth_loading")
                        : tab === "login" ? t("auth_btn_login") : t("auth_btn_signup")}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-1">
                      <div className="flex-1 h-px bg-[var(--border)]" />
                      <span className="text-[10px] text-[var(--muted)] uppercase tracking-wide">{t("auth_or")}</span>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    {/* Google OAuth */}
                    <button
                      type="button"
                      onClick={handleGoogle}
                      className="w-full py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] transition-colors flex items-center justify-center gap-2.5"
                    >
                      {/* Google icon */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {t("auth_btn_google")}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
