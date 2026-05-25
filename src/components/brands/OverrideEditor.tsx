"use client"
// Right-pane: edit the selected path. Choose target layer based on perms,
// PUT to /api/brands/[id]/layers/[kind].
import { useEffect, useState } from "react"
import { RotateCcw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TokenSourceBadge } from "./TokenSourceBadge"
import { apiSend } from "@/lib/adoption/api"
import { pickEditableLayer } from "@/lib/brands/resolve"
import type { LayerKind, TokenLayer, BrandPermissions } from "@/types/brands"
import { getAt } from "@/lib/brands/paths"
import type { DesignTokens } from "@/types/tokens"

interface Props {
  brandId: string
  path: string | null
  resolvedTokens: DesignTokens
  layers: TokenLayer[]
  provenance: Record<string, LayerKind>
  perms: BrandPermissions
  onSaved: () => void
}

export function OverrideEditor({ brandId, path, resolvedTokens, layers, provenance, perms, onSaved }: Props) {
  const [value, setValue] = useState("")
  const [target, setTarget] = useState<LayerKind>("brand")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!path) return
    const cur = getAt(resolvedTokens, path)
    setValue(typeof cur === "string" ? cur : JSON.stringify(cur))
    const suggested = pickEditableLayer(path, perms) ?? "brand"
    setTarget(suggested)
    setErr(null)
  }, [path, resolvedTokens, perms])

  if (!path) {
    return <div className="p-6 text-center text-xs text-[var(--muted-foreground)] italic">
      Select a token from the tree to inspect or override.
    </div>
  }

  const source = provenance[path] ?? "core"
  const canEdit =
    (target === "core"            && perms.canEditCore) ||
    (target === "semantic_global" && perms.canEditSemanticGlobal) ||
    (target === "semantic_brand"  && perms.canEditSemanticBrand) ||
    (target === "brand"           && perms.canEditBrand)

  const isHex = typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value)

  const save = async () => {
    setBusy(true); setErr(null)
    try {
      // Update payload by merging the single path into the chosen layer.
      const layer = layers.find(l => l.kind === target && (target === "core" || target === "semantic_global" ? l.brand_id === null : l.brand_id === brandId))
      const payload = { ...((layer?.payload as Record<string, unknown>) ?? {}) }
      // For non-core layers, payload is a path-map: just set the key.
      if (target === "core") {
        // Deep-set into existing tokens
        const next = JSON.parse(JSON.stringify(layer?.payload ?? resolvedTokens))
        const { setAt } = await import("@/lib/brands/paths")
        let parsed: unknown = value
        try { parsed = JSON.parse(value) } catch { /* keep string */ }
        setAt(next, path, parsed)
        await apiSend(`/api/brands/${brandId}/layers/core`, "PUT", { payload: next })
      } else {
        let parsed: unknown = value
        try { parsed = JSON.parse(value) } catch { /* keep string */ }
        payload[path] = parsed
        await apiSend(`/api/brands/${brandId}/layers/${target}`, "PUT", { payload })
      }
      onSaved()
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  const revert = async () => {
    if (target === "core") return
    setBusy(true); setErr(null)
    try {
      const layer = layers.find(l => l.kind === target && (l.brand_id === brandId))
      if (!layer) return
      const payload = { ...(layer.payload as Record<string, unknown>) }
      delete payload[path]
      await apiSend(`/api/brands/${brandId}/layers/${target}`, "PUT", { payload })
      onSaved()
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1">
        <div className="text-[10px] uppercase text-[var(--muted-foreground)]">Path</div>
        <code className="block text-[11px] font-mono bg-[var(--surface-2)] p-2 rounded break-all">{path}</code>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-[10px] uppercase text-[var(--muted-foreground)]">Resolved from</span>
        <TokenSourceBadge kind={source} />
      </div>

      <div>
        <div className="text-[10px] uppercase text-[var(--muted-foreground)] mb-1">Override at</div>
        <div className="grid grid-cols-2 gap-1">
          {(["core","semantic_global","semantic_brand","brand"] as LayerKind[]).map(k => {
            const enabled =
              (k === "core"            && perms.canEditCore) ||
              (k === "semantic_global" && perms.canEditSemanticGlobal) ||
              (k === "semantic_brand"  && perms.canEditSemanticBrand) ||
              (k === "brand"           && perms.canEditBrand)
            return (
              <button key={k} disabled={!enabled} onClick={() => setTarget(k)}
                className={`px-2 py-1 rounded text-[10px] uppercase border transition-colors ${
                  target === k ? "border-[var(--accent)] bg-[var(--surface-2)]" :
                  "border-[var(--border)]"
                } ${!enabled ? "opacity-30 cursor-not-allowed" : "hover:border-[var(--accent)]"}`}>
                {k.replace("_", "·")}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase text-[var(--muted-foreground)] mb-1">Value</div>
        <div className="flex items-center gap-2">
          {isHex && <input type="color" value={value} onChange={e => setValue(e.target.value)} className="w-9 h-9 rounded border border-[var(--border)] bg-transparent" />}
          <input value={value} onChange={e => setValue(e.target.value)}
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs font-mono focus:border-[var(--accent)] focus:outline-none" />
        </div>
      </div>

      {err && <p className="text-xs text-[var(--danger)]">{err}</p>}

      <div className="flex items-center gap-2 pt-1">
        <Button variant="accent" size="sm" onClick={save} disabled={busy || !canEdit} className="gap-1.5">
          <Save size={12} /> Save override
        </Button>
        {source !== "core" && target !== "core" && (
          <Button variant="ghost" size="sm" onClick={revert} disabled={busy} className="gap-1.5">
            <RotateCcw size={12} /> Revert to core
          </Button>
        )}
      </div>
    </div>
  )
}
