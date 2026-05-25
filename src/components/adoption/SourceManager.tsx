"use client"
import { useEffect, useState } from "react"
import { Plus, Trash2, RefreshCw, X, Code2, Frame } from "lucide-react"
const Github = Code2
const Figma = Frame
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { apiGet, apiSend } from "@/lib/adoption/api"
import type { TrackedRepo, TrackedFigmaFile } from "@/types/adoption"
import { useAdoptionStore } from "@/store/adoption"

interface Props { open: boolean; onClose: () => void; onScanned?: () => void }

export function SourceManager({ open, onClose, onScanned }: Props) {
  const { repos, figmaFiles, setRepos, setFigmaFiles } = useAdoptionStore()
  const [tab, setTab] = useState<"github" | "figma">("github")
  const [ownerRepo, setOwnerRepo] = useState("")
  const [team, setTeam] = useState("")
  const [pat, setPat] = useState("")
  const [figmaKey, setFigmaKey] = useState("")
  const [figmaToken, setFigmaToken] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const r = await apiGet<{ repos: TrackedRepo[]; figmaFiles: TrackedFigmaFile[] }>("/api/adoption/sources")
      setRepos(r.repos); setFigmaFiles(r.figmaFiles)
    } catch (e) { setErr(String(e)) }
  }
  useEffect(() => { if (open) refresh() }, [open])

  const addRepo = async () => {
    setErr(null)
    const m = ownerRepo.match(/^([^/\s]+)\/([^/\s]+)$/)
    if (!m) { setErr("Format: owner/repo"); return }
    setBusy("add")
    try {
      await apiSend("/api/adoption/sources", "POST", {
        kind: "github", owner: m[1], repo: m[2], team: team || null,
      })
      setOwnerRepo(""); setTeam("")
      await refresh()
    } catch (e) { setErr(String(e)) } finally { setBusy(null) }
  }
  const addFigma = async () => {
    setErr(null)
    if (!figmaKey.trim()) { setErr("File key required"); return }
    setBusy("add")
    try {
      await apiSend("/api/adoption/sources", "POST", { kind: "figma", file_key: figmaKey.trim(), team: team || null })
      setFigmaKey(""); setTeam(""); await refresh()
    } catch (e) { setErr(String(e)) } finally { setBusy(null) }
  }
  const delSource = async (kind: "github" | "figma", id: string) => {
    setBusy(id)
    try { await apiSend(`/api/adoption/sources?kind=${kind}&id=${id}`, "DELETE"); await refresh() }
    catch (e) { setErr(String(e)) } finally { setBusy(null) }
  }
  const runScan = async (kind: "github" | "figma", id: string) => {
    setBusy(id); setErr(null)
    try {
      await apiSend("/api/adoption/scan", "POST", {
        kind, target_id: id,
        github_pat: kind === "github" ? pat || undefined : undefined,
        figma_token: kind === "figma" ? figmaToken || undefined : undefined,
      })
      await refresh()
      onScanned?.()
    } catch (e) { setErr(String(e)) } finally { setBusy(null) }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold">Tracked sources</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X size={14} /></Button>
            </div>

            <div className="flex border-b border-[var(--border)]">
              {(["github", "figma"] as const).map(k => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex-1 px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    tab === k ? "text-[var(--foreground)] border-b-2 border-[var(--accent)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}>
                  {k === "github" ? <Github size={12} /> : <Figma size={12} />}
                  {k === "github" ? "GitHub Repos" : "Figma Files"}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {tab === "github" ? (
                <>
                  <div className="grid grid-cols-12 gap-2">
                    <input value={ownerRepo} onChange={e => setOwnerRepo(e.target.value)}
                      placeholder="owner/repo (e.g. vercel/next.js)"
                      className="col-span-5 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
                    <input value={team} onChange={e => setTeam(e.target.value)} placeholder="team (optional)"
                      className="col-span-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
                    <input value={pat} onChange={e => setPat(e.target.value)} placeholder="GH PAT (private repos)" type="password"
                      className="col-span-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
                    <Button variant="accent" size="sm" onClick={addRepo} disabled={busy === "add"} className="col-span-1 gap-1">
                      <Plus size={12} />
                    </Button>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {repos.length === 0 && <p className="text-xs text-[var(--muted-foreground)] py-3">No repos tracked yet.</p>}
                    {repos.map(r => (
                      <div key={r.id} className="flex items-center gap-2 py-2.5 text-xs">
                        <Github size={12} className="text-[var(--muted-foreground)]" />
                        <span className="font-mono">{r.owner}/{r.repo}</span>
                        {r.team && <span className="px-1.5 py-0.5 bg-[var(--surface-2)] rounded text-[10px]">{r.team}</span>}
                        <span className="ml-auto text-[var(--muted-foreground)] text-[10px]">
                          {r.last_scanned_at ? `scanned ${new Date(r.last_scanned_at).toLocaleString()}` : "never scanned"}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => runScan("github", r.id)} disabled={busy === r.id}>
                          <RefreshCw size={11} className={busy === r.id ? "animate-spin" : ""} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => delSource("github", r.id)} disabled={busy === r.id}>
                          <Trash2 size={11} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-2">
                    <input value={figmaKey} onChange={e => setFigmaKey(e.target.value)} placeholder="Figma file key"
                      className="col-span-5 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
                    <input value={team} onChange={e => setTeam(e.target.value)} placeholder="team (optional)"
                      className="col-span-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
                    <input value={figmaToken} onChange={e => setFigmaToken(e.target.value)} placeholder="Figma PAT" type="password"
                      className="col-span-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
                    <Button variant="accent" size="sm" onClick={addFigma} disabled={busy === "add"} className="col-span-1 gap-1">
                      <Plus size={12} />
                    </Button>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {figmaFiles.length === 0 && <p className="text-xs text-[var(--muted-foreground)] py-3">No Figma files tracked yet.</p>}
                    {figmaFiles.map(f => (
                      <div key={f.id} className="flex items-center gap-2 py-2.5 text-xs">
                        <Figma size={12} className="text-[var(--muted-foreground)]" />
                        <span className="font-mono">{f.file_name ?? f.file_key}</span>
                        {f.team && <span className="px-1.5 py-0.5 bg-[var(--surface-2)] rounded text-[10px]">{f.team}</span>}
                        <span className="ml-auto text-[var(--muted-foreground)] text-[10px]">
                          {f.last_scanned_at ? `scanned ${new Date(f.last_scanned_at).toLocaleString()}` : "never scanned"}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => runScan("figma", f.id)} disabled={busy === f.id}>
                          <RefreshCw size={11} className={busy === f.id ? "animate-spin" : ""} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => delSource("figma", f.id)} disabled={busy === f.id}>
                          <Trash2 size={11} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {err && <p className="text-xs text-[var(--danger)]">{err}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
