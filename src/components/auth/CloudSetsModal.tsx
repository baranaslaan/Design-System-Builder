"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Cloud, Save, Trash2, Download, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuthStore } from "@/store/auth"
import { useTokensStore } from "@/store/tokens"
import { useT } from "@/lib/i18n"

interface CloudSet {
  id: string
  name: string
  updated_at: string
}

interface CloudSetsModalProps {
  open: boolean
  onClose: () => void
}

export function CloudSetsModal({ open, onClose }: CloudSetsModalProps) {
  const t = useT()
  const { user } = useAuthStore()
  const { tokens } = useTokensStore()
  const [sets, setSets] = useState<CloudSet[]>([])
  const [loading, setLoading] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from("token_sets")
      .select("id, name, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
    setSets((data ?? []) as CloudSet[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (open) fetchSets()
  }, [open, fetchSets])

  const handleSave = async () => {
    if (!saveName.trim() || !user) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from("token_sets").insert({
      user_id: user.id,
      name: saveName.trim(),
      tokens: tokens,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaveName("")
    fetchSets()
  }

  const handleLoad = async (id: string) => {
    const { data } = await supabase
      .from("token_sets")
      .select("tokens")
      .eq("id", id)
      .single()
    if (data?.tokens) {
      useTokensStore.getState().importJSON(JSON.stringify(data.tokens))
      onClose()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from("token_sets").delete().eq("id", id)
    setSets((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
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
            <div className="px-5 pt-5 pb-4 border-b border-[var(--border)] flex items-center gap-3">
              <Cloud size={16} className="text-[var(--accent)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-sm font-semibold text-[var(--foreground)]">
                  {t("cloud_title")}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[var(--muted)] mt-0.5">
                  {t("cloud_subtitle")}
                </Dialog.Description>
              </div>
              <Dialog.Close className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors">
                <X size={14} />
              </Dialog.Close>
            </div>

            <div className="p-5 space-y-4">
              {/* Save current */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--foreground)]">{t("cloud_save_current")}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("cloud_name_placeholder")}
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    className="flex-1 px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving || !saveName.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-40 transition-opacity"
                    style={{ background: "var(--accent)" }}
                  >
                    <Save size={13} />
                    {saving ? "…" : t("cloud_btn_save")}
                  </button>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>

              <div className="h-px bg-[var(--border)]" />

              {/* Saved sets list */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[var(--foreground)]">{t("cloud_saved_sets")}</p>
                {loading ? (
                  <div className="flex items-center justify-center py-6 text-xs text-[var(--muted)]">
                    {t("cloud_loading")}
                  </div>
                ) : sets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-[var(--muted)]">
                    <Plus size={20} className="opacity-30" />
                    <p className="text-xs">{t("cloud_empty")}</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {sets.map((s) => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">{s.name}</p>
                            <p className="text-[10px] text-[var(--muted)]">
                              {new Date(s.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleLoad(s.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--accent)] transition-all"
                            title={t("cloud_btn_load")}
                          >
                            <Download size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[var(--surface-3)] text-[var(--muted)] hover:text-red-400 transition-all"
                            title={t("cloud_btn_delete")}
                          >
                            <Trash2 size={13} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
