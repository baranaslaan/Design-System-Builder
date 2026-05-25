"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiGet, apiSend } from "@/lib/adoption/api"
import type { Brand } from "@/types/brands"

export default function BrandsListPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const { brands } = await apiGet<{ brands: Brand[] }>("/api/brands")
      setBrands(brands)
    } catch (e) { setErr(String(e)) }
  }
  useEffect(() => { refresh() }, [])

  const create = async () => {
    setErr(null); setBusy(true)
    try {
      await apiSend("/api/brands", "POST", {
        name: name.trim(),
        slug: slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      })
      setName(""); setSlug(""); await refresh()
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="h-12 flex items-center px-4 gap-3 border-b border-[var(--border)] sticky top-0 z-20 bg-[var(--background)]">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={14} /> Back to editor
        </Link>
        <div className="h-5 w-px bg-[var(--border)]" />
        <h1 className="text-sm font-semibold flex items-center gap-1.5"><Layers size={14} /> Brands</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <h2 className="text-xs uppercase text-[var(--muted-foreground)] mb-2">Create a brand</h2>
          <div className="grid grid-cols-12 gap-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Brand name"
              className="col-span-5 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none" />
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug-auto"
              className="col-span-5 bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs font-mono focus:border-[var(--accent)] focus:outline-none" />
            <Button variant="accent" size="sm" onClick={create} disabled={busy || !name.trim()} className="col-span-2 gap-1">
              <Plus size={12} /> Create
            </Button>
          </div>
          {err && <p className="text-[11px] text-[var(--danger)] mt-2">{err}</p>}
          <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
            First brand seeds your core + semantic_global layers from the default preset. Subsequent brands reuse them.
          </p>
        </section>

        <section>
          <h2 className="text-xs uppercase text-[var(--muted-foreground)] mb-2">Your brands</h2>
          {brands.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] italic p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
              No brands yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {brands.map(b => (
                <Link key={b.id} href={`/brands/${b.id}`}
                  className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors">
                  <div className="text-sm font-semibold">{b.name}</div>
                  <code className="text-[10px] text-[var(--muted-foreground)] font-mono">{b.slug}</code>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
                    {new Date(b.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
