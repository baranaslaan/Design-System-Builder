"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  RefreshCw, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, CheckCircle2, Link2,
  History, ChevronDown, ChevronRight, Trash2,
} from "lucide-react"
import { useTokensStore } from "@/store/tokens"
import { useFigmaSyncStore } from "@/store/figmaSync"
import { useT } from "@/lib/i18n"
import { getConnectionStatus } from "@/lib/figma/client"
import { pull, push, sync, type ConflictResolver } from "@/lib/figma/syncEngine"
import type { SyncResult, SyncLogEntry, TokenConflict } from "@/lib/figma/types"
import { ConflictDiffModal } from "./ConflictDiffModal"

const DIRECTION_ICONS = { pull: ArrowDownToLine, push: ArrowUpFromLine, sync: RefreshCw }

export function FigmaSyncPanel() {
  const t = useT()
  const { tokens, importJSON } = useTokensStore()
  const {
    connected, setConnected,
    activeFileKey, setActiveFileKey,
    baselines, setBaseline, getBaseline,
    pushLog, log, clearLog,
  } = useFigmaSyncStore()

  const [fileKey, setFileKey] = useState(() => activeFileKey ?? "")
  const [busy, setBusy] = useState<"pull" | "push" | "sync" | null>(null)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [conflicts, setConflicts] = useState<TokenConflict[] | null>(null)
  const [pendingResolver, setPendingResolver] = useState<((r: TokenConflict[]) => void) | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    getConnectionStatus().then(setConnected)
  }, [setConnected])

  const baseline = fileKey ? baselines[fileKey] : undefined

  const handleConnect = async () => {
    // The start route is now auth-gated (binds OAuth to the Supabase user).
    // Fetch it with the access token, then navigate to the returned auth URL.
    const { apiGet } = await import("@/lib/adoption/api")
    const { url } = await apiGet<{ url: string }>("/api/figma/oauth/start")
    window.location.href = url
  }

  const finish = (result: SyncResult) => {
    pushLog(result.log)
    setBusy(null)
    setStatus(
      result.ok
        ? { ok: true,  msg: t("sync_success") }
        : { ok: false, msg: result.log.error ?? t("sync_failed") },
    )
  }

  const doPull = async () => {
    if (!fileKey) return
    setBusy("pull"); setStatus(null); setActiveFileKey(fileKey)
    const result = await pull({
      fileKey,
      localTokens: tokens,
      baseLeaves: getBaseline(fileKey),
      applyToStore: (next) => importJSON(JSON.stringify(next)),
      saveBaseline: (leaves) => setBaseline(fileKey, leaves),
    })
    finish(result)
  }

  const doPush = async () => {
    if (!fileKey) return
    setBusy("push"); setStatus(null); setActiveFileKey(fileKey)
    const result = await push({
      fileKey,
      localTokens: tokens,
      baseLeaves: getBaseline(fileKey),
      saveBaseline: (leaves) => setBaseline(fileKey, leaves),
    })
    finish(result)
  }

  const resolver: ConflictResolver = (cs) =>
    new Promise<TokenConflict[]>((resolve) => {
      setConflicts(cs)
      setPendingResolver(() => (r: TokenConflict[]) => { setConflicts(null); resolve(r) })
    })

  const doSync = async () => {
    if (!fileKey) return
    setBusy("sync"); setStatus(null); setActiveFileKey(fileKey)
    const result = await sync({
      fileKey,
      localTokens: tokens,
      baseLeaves: getBaseline(fileKey),
      applyToStore: (next) => importJSON(JSON.stringify(next)),
      saveBaseline: (leaves) => setBaseline(fileKey, leaves),
      resolve: resolver,
    })
    finish(result)
  }

  return (
    <div className="space-y-4">
      {/* Connection row */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              connected === true ? "bg-emerald-500" : connected === false ? "bg-[var(--muted)]" : "bg-amber-400"
            }`}
          />
          <span className="text-xs text-[var(--foreground)] truncate">
            {connected === true ? t("sync_connected") : connected === false ? t("sync_not_connected") : "…"}
          </span>
        </div>
        {connected === false && (
          <button
            onClick={handleConnect}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            <Link2 size={12} />
            {t("sync_connect_figma")}
          </button>
        )}
      </div>

      {/* File key */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--foreground)]">{t("sync_file_key")}</label>
        <input
          value={fileKey}
          onChange={(e) => setFileKey(e.target.value.trim())}
          placeholder="abc123XYZ"
          className="w-full px-3 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] font-mono"
        />
        {baseline && (
          <p className="text-[10px] text-[var(--muted)]">
            {t("sync_last_synced")}: {new Date(baseline.lastSyncedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          disabled={!connected || !fileKey || !!busy}
          onClick={doPull}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowDownToLine size={14} />
          <span className="text-[11px]">{busy === "pull" ? "…" : t("sync_pull")}</span>
        </button>
        <button
          disabled={!connected || !fileKey || !!busy}
          onClick={doSync}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg border border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <RefreshCw size={14} />
          <span className="text-[11px] font-medium">{busy === "sync" ? "…" : t("sync_sync")}</span>
        </button>
        <button
          disabled={!connected || !fileKey || !!busy}
          onClick={doPush}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowUpFromLine size={14} />
          <span className="text-[11px]">{busy === "push" ? "…" : t("sync_push")}</span>
        </button>
      </div>

      {/* Status banner */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg ${
              status.ok ? "text-emerald-500 bg-emerald-500/10" : "text-red-400 bg-red-400/10"
            }`}
          >
            {status.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            <span className="truncate">{status.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History — inline collapsible */}
      <div className="border-t border-[var(--border)] pt-3">
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <span className="flex items-center gap-2">
            {historyOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <History size={12} />
            {t("sync_history")} <span className="text-[10px]">({log.length})</span>
          </span>
          {historyOpen && log.length > 0 && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); clearLog() }}
              className="flex items-center gap-1 hover:text-red-400"
            >
              <Trash2 size={11} />
              {t("sync_log_clear")}
            </span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {historyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg">
                {log.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--muted)]">{t("sync_log_empty")}</div>
                ) : (
                  log.map((entry) => (
                    <LogRow
                      key={entry.id}
                      entry={entry}
                      expanded={expandedLog === entry.id}
                      onToggle={() => setExpandedLog(expandedLog === entry.id ? null : entry.id)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conflict resolution — focused decision flow only */}
      {conflicts && pendingResolver && (
        <ConflictDiffModal
          open
          conflicts={conflicts}
          onResolve={(r) => pendingResolver(r)}
          onCancel={() => pendingResolver(conflicts.map((c) => ({ ...c, resolution: "skip" })))}
        />
      )}
    </div>
  )
}

function LogRow({ entry, expanded, onToggle }: { entry: SyncLogEntry; expanded: boolean; onToggle: () => void }) {
  const t = useT()
  const Icon = DIRECTION_ICONS[entry.direction]
  const totalChanges = entry.changes.pushed.length + entry.changes.pulled.length + entry.changes.skipped.length

  return (
    <div className="px-3 py-2">
      <button onClick={onToggle} className="w-full flex items-center gap-2 text-left">
        {expanded ? <ChevronDown size={11} className="text-[var(--muted)]" /> : <ChevronRight size={11} className="text-[var(--muted)]" />}
        <Icon size={12} className={entry.error ? "text-red-400" : "text-[var(--accent)]"} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium truncate">
            {t(`sync_${entry.direction}` as "sync_pull" | "sync_push" | "sync_sync")}{" "}
            · <span className="font-mono text-[10px] text-[var(--muted)]">{entry.fileKey}</span>
          </p>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">
            {new Date(entry.timestamp).toLocaleString()} · {t("sync_log_changes", { n: totalChanges })}
            {entry.conflictsCount > 0 && <> · {t("sync_log_conflicts", { n: entry.conflictsCount })}</>}
          </p>
        </div>
        {entry.error && <AlertTriangle size={11} className="text-red-400" />}
      </button>

      {expanded && (
        <div className="mt-2 ml-5 space-y-1.5 text-[10px]">
          {entry.error && (
            <div className="px-2 py-1 bg-red-400/10 text-red-400 rounded">{entry.error}</div>
          )}
          <ChangeBlock label={t("sync_log_pushed")} leaves={entry.changes.pushed} color="text-blue-400" />
          <ChangeBlock label={t("sync_log_pulled")} leaves={entry.changes.pulled} color="text-emerald-500" />
          <ChangeBlock label={t("sync_log_skipped")} leaves={entry.changes.skipped} color="text-[var(--muted)]" />
          <ChangeBlock label={t("sync_log_unsupported")} leaves={entry.changes.unsupported} color="text-amber-500" />
        </div>
      )}
    </div>
  )
}

function ChangeBlock({ label, leaves, color }: { label: string; leaves: { path: string; value: unknown }[]; color: string }) {
  if (leaves.length === 0) return null
  return (
    <div>
      <p className={`uppercase tracking-wider text-[9px] ${color} mb-0.5`}>
        {label} ({leaves.length})
      </p>
      <ul className="space-y-0.5 max-h-24 overflow-y-auto">
        {leaves.slice(0, 30).map((l) => (
          <li key={l.path} className="font-mono text-[10px] text-[var(--muted)]">
            {l.path} = <span className="text-[var(--foreground)]">{String(l.value).slice(0, 36)}</span>
          </li>
        ))}
        {leaves.length > 30 && <li className="text-[10px] text-[var(--muted)] italic">… +{leaves.length - 30} more</li>}
      </ul>
    </div>
  )
}
