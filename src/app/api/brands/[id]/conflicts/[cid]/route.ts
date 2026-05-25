// POST /api/brands/[id]/conflicts/[cid]
// Body: { resolutions: Array<{ path, resolution: "keep_brand" | "accept_core" }> }
// Applies the chosen resolutions to the brand's layer payload, then marks
// the conflict resolved.
import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"
import { computePermissions } from "@/lib/brands/perms"
import type { MergeConflictEntry } from "@/types/brands"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> },
) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth
  const { id, cid } = await params

  const { perms } = await computePermissions(supabase, id, user.id)
  if (!perms.canResolveConflicts) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const { resolutions } = await req.json() as { resolutions: Array<{ path: string; resolution: "keep_brand" | "accept_core" }> }
  if (!Array.isArray(resolutions)) return NextResponse.json({ error: "resolutions[] required" }, { status: 400 })

  // Ensure the conflict actually belongs to this brand — prevents resolving
  // brand A's pending conflict against brand B's layers by URL-tampering.
  const { data: conflict } = await supabase.from("merge_conflicts")
    .select("*").eq("id", cid).eq("brand_id", id).maybeSingle()
  if (!conflict) return NextResponse.json({ error: "conflict not found" }, { status: 404 })

  // Pull brand + semantic_brand layers
  const { data: layers } = await supabase.from("token_layers")
    .select("*").eq("brand_id", id).in("kind", ["brand", "semantic_brand"])
  const brandLayer    = layers?.find((l) => l.kind === "brand")
  const semBrandLayer = layers?.find((l) => l.kind === "semantic_brand")

  const brandPayload    = { ...(brandLayer?.payload    as Record<string, unknown> ?? {}) }
  const semBrandPayload = { ...(semBrandLayer?.payload as Record<string, unknown> ?? {}) }

  // For each resolution, if accept_core → delete the override path from brand & semantic_brand.
  for (const r of resolutions) {
    if (r.resolution === "accept_core") {
      delete brandPayload[r.path]
      delete semBrandPayload[r.path]
    }
  }

  if (brandLayer) {
    await supabase.from("token_layers").update({
      payload: brandPayload, version: brandLayer.version + 1, updated_at: new Date().toISOString(), updated_by: user.id,
    }).eq("id", brandLayer.id)
  }
  if (semBrandLayer) {
    await supabase.from("token_layers").update({
      payload: semBrandPayload, version: semBrandLayer.version + 1, updated_at: new Date().toISOString(), updated_by: user.id,
    }).eq("id", semBrandLayer.id)
  }

  // Persist resolution choices on the conflict row and mark resolved.
  const merged: MergeConflictEntry[] = (conflict.conflicts as MergeConflictEntry[]).map((c) => {
    const r = resolutions.find((x) => x.path === c.path)
    return r ? { ...c, resolution: r.resolution } : c
  })
  await supabase.from("merge_conflicts").update({
    conflicts: merged, status: "resolved", resolved_at: new Date().toISOString(),
  }).eq("id", cid)

  return NextResponse.json({ ok: true })
}
