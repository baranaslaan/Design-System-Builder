// PUT /api/brands/[id]/layers/[kind]
// Body: { payload: object } — sparse path map, or full DesignTokens for core.
// On 'core' updates, auto-create a merge_conflicts row for every brand whose
// overrides intersect the changed paths.
import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"
import { computePermissions } from "@/lib/brands/perms"
import { diffCoreVersions, detectConflicts } from "@/lib/brands/diff"
import { assertSafePath } from "@/lib/brands/paths"
import type { LayerKind } from "@/types/brands"
import type { DesignTokens } from "@/types/tokens"

export const dynamic = "force-dynamic"

const ALLOWED: LayerKind[] = ["core", "semantic_global", "semantic_brand", "brand"]

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth
  const { id, kind: kindRaw } = await params
  const kind = kindRaw as LayerKind
  if (!ALLOWED.includes(kind)) return NextResponse.json({ error: "bad kind" }, { status: 400 })

  const { payload } = await req.json()
  if (typeof payload !== "object" || payload === null)
    return NextResponse.json({ error: "payload object required" }, { status: 400 })

  // Reject prototype-pollution attempts in sparse path-map layers.
  if (kind !== "core") {
    try {
      for (const key of Object.keys(payload)) assertSafePath(key)
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "bad path" }, { status: 400 })
    }
  }

  const { perms, isOwner } = await computePermissions(supabase, id, user.id)
  const allowed =
    (kind === "core"            && perms.canEditCore) ||
    (kind === "semantic_global" && perms.canEditSemanticGlobal) ||
    (kind === "semantic_brand"  && perms.canEditSemanticBrand) ||
    (kind === "brand"           && perms.canEditBrand)
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const { data: brand } = await supabase.from("brands").select("owner_id").eq("id", id).single()
  const ownerForLayer = isOwner ? user.id : brand!.owner_id
  const isGlobal = kind === "core" || kind === "semantic_global"
  const brandId = isGlobal ? null : id

  // Snapshot the old payload if this is a 'core' change (needed for conflict detection).
  let oldCore: DesignTokens | null = null
  if (kind === "core") {
    const { data: prev } = await supabase.from("token_layers")
      .select("payload, version").eq("owner_id", ownerForLayer).is("brand_id", null).eq("kind", "core").maybeSingle()
    oldCore = (prev?.payload as DesignTokens) ?? null
  }

  // Upsert
  const { data: existing } = await supabase.from("token_layers")
    .select("id, version")
    .eq("owner_id", ownerForLayer)
    .eq("kind", kind)
    .is("brand_id", brandId)
    .maybeSingle()

  if (existing) {
    await supabase.from("token_layers").update({
      payload, version: existing.version + 1,
      updated_by: user.id, updated_at: new Date().toISOString(),
    }).eq("id", existing.id)
  } else {
    await supabase.from("token_layers").insert({
      owner_id: ownerForLayer, brand_id: brandId, kind, payload,
      version: 1, updated_by: user.id,
    })
  }

  // If core changed, detect conflicts against every brand owned by this owner.
  if (kind === "core" && oldCore) {
    const newCore = payload as DesignTokens
    const changes = diffCoreVersions(oldCore, newCore)
    if (changes.length) {
      const { data: brands } = await supabase.from("brands").select("id").eq("owner_id", ownerForLayer)
      const { data: layers } = await supabase.from("token_layers")
        .select("brand_id, kind, payload").in("brand_id", (brands ?? []).map((b) => b.id))

      const grouped = new Map<string, { brand: Record<string, unknown>; sembrand: Record<string, unknown> }>()
      for (const l of layers ?? []) {
        if (!l.brand_id) continue
        if (!grouped.has(l.brand_id)) grouped.set(l.brand_id, { brand: {}, sembrand: {} })
        const g = grouped.get(l.brand_id)!
        if (l.kind === "brand") g.brand = (l.payload as Record<string, unknown>) ?? {}
        if (l.kind === "semantic_brand") g.sembrand = (l.payload as Record<string, unknown>) ?? {}
      }

      const oldVersion = (await supabase.from("token_layers")
        .select("version").eq("owner_id", ownerForLayer).is("brand_id", null).eq("kind", "core").single()).data?.version ?? 1

      for (const [brandIter, ov] of grouped) {
        const entries = detectConflicts(changes, ov.brand, ov.sembrand)
        if (entries.length) {
          await supabase.from("merge_conflicts").insert({
            owner_id: ownerForLayer,
            brand_id: brandIter,
            core_version_from: oldVersion - 1,
            core_version_to: oldVersion,
            conflicts: entries,
            status: "open",
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
