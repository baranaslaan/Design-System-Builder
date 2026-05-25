"use client"
import { useEffect, useState, use as usePromise, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Columns2, AlertOctagon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InheritanceTree } from "@/components/brands/InheritanceTree"
import { OverrideEditor } from "@/components/brands/OverrideEditor"
import { ConflictResolver } from "@/components/brands/ConflictResolver"
import { SideBySidePreview } from "@/components/brands/SideBySidePreview"
import { apiGet } from "@/lib/adoption/api"
import { useBrandsStore } from "@/store/brands"
import type { Brand, MergeConflict, ResolvedTokens, TokenLayer, BrandPermissions } from "@/types/brands"

interface ResolvedResp { resolved: ResolvedTokens; permissions: BrandPermissions; layers: TokenLayer[] }
interface ConflictsResp { conflicts: MergeConflict[] }
interface BrandsResp { brands: Brand[] }

export default function BrandPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params)
  const {
    layers, resolved, permissions, conflicts, selectedPath,
    setLayers, setResolved, setPermissions, setConflicts, setSelectedPath,
    brands, setBrands,
  } = useBrandsStore()
  const [filter, setFilter] = useState("")
  const [compareId, setCompareId] = useState<string | "">("")
  const [compareResolved, setCompareResolved] = useState<ResolvedTokens | null>(null)
  const [showCompare, setShowCompare] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [r, c, br] = await Promise.all([
        apiGet<ResolvedResp>(`/api/brands/${id}/resolved`),
        apiGet<ConflictsResp>(`/api/brands/${id}/conflicts`),
        apiGet<BrandsResp>("/api/brands"),
      ])
      setResolved(r.resolved); setPermissions(r.permissions); setLayers(r.layers)
      setConflicts(c.conflicts)
      setBrands(br.brands)
    } catch (e) { setErr(String(e)) }
  }, [id])
  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!compareId || !showCompare) { setCompareResolved(null); return }
    apiGet<ResolvedResp>(`/api/brands/${compareId}/resolved`)
      .then(r => setCompareResolved(r.resolved)).catch(e => setErr(String(e)))
  }, [compareId, showCompare])

  const brand = brands.find(b => b.id === id)
  const openConflicts = conflicts.filter(c => c.status === "open")

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)] sticky top-0 z-20 bg-[var(--background)]">
        <Link href="/brands" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={14} /> Brands
        </Link>
        <div className="h-5 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold">{brand?.name ?? "Brand"}</h1>
        <code className="text-[10px] text-[var(--muted-foreground)] font-mono">{brand?.slug}</code>
        {openConflicts.length > 0 && (
          <span className="ml-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                style={{ color: "var(--danger)", background: "rgba(239,68,68,0.10)" }}>
            <AlertOctagon size={11} /> {openConflicts.length} conflict{openConflicts.length === 1 ? "" : "s"}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <select value={compareId} onChange={e => { setCompareId(e.target.value); setShowCompare(!!e.target.value) }}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1 text-[11px]">
            <option value="">Compare with…</option>
            {brands.filter(b => b.id !== id).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <Button variant={showCompare ? "accent" : "ghost"} size="sm" onClick={() => setShowCompare(s => !s)} className="gap-1.5">
            <Columns2 size={12} /> Side-by-side
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 space-y-4">
        {err && <p className="text-xs text-[var(--danger)]">{err}</p>}

        {showCompare && (
          <SideBySidePreview
            leftLabel={brand?.name ?? "This brand"}
            rightLabel={brands.find(b => b.id === compareId)?.name ?? "Other"}
            leftTokens={resolved?.tokens ?? null}
            rightTokens={compareResolved?.tokens ?? null} />
        )}

        <div className="grid grid-cols-12 gap-4">
          {/* Tree */}
          <aside className="col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
              <h2 className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Inheritance</h2>
              <div className="ml-auto flex items-center gap-1.5 bg-[var(--surface-2)] rounded px-2">
                <Search size={11} className="text-[var(--muted-foreground)]" />
                <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="filter paths…"
                  className="bg-transparent text-[11px] py-1 focus:outline-none w-40" />
              </div>
            </div>
            <div className="p-2 max-h-[70vh] overflow-y-auto">
              {resolved
                ? <InheritanceTree
                    tokens={resolved.tokens}
                    provenance={resolved.provenance}
                    selectedPath={selectedPath}
                    onSelect={setSelectedPath}
                    filter={filter} />
                : <p className="text-xs text-[var(--muted-foreground)] italic p-4">Loading…</p>}
            </div>
          </aside>

          {/* Editor */}
          <aside className="col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
              <h2 className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Editor</h2>
              {permissions && (
                <div className="ml-auto flex items-center gap-1 text-[9px]">
                  {permissions.canEditCore           && <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">core</span>}
                  {permissions.canEditSemanticGlobal && <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">sem·g</span>}
                  {permissions.canEditSemanticBrand  && <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">sem·b</span>}
                  {permissions.canEditBrand          && <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">brand</span>}
                </div>
              )}
            </div>
            {resolved && (
              <OverrideEditor
                brandId={id}
                path={selectedPath}
                resolvedTokens={resolved.tokens}
                provenance={resolved.provenance}
                layers={layers}
                perms={permissions}
                onSaved={refresh} />
            )}
          </aside>
        </div>
      </main>

      {openConflicts.length > 0 && (
        <ConflictResolver brandId={id} conflicts={openConflicts} onResolved={refresh} />
      )}
    </div>
  )
}
