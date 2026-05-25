import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"
import { PRESETS } from "@/data/presets"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth

  // Brands the user owns + brands they're a member of (RLS handles row visibility).
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from("brands").select("*").eq("owner_id", user.id),
    supabase.from("brand_members").select("brand_id, role, brands(*)").eq("user_id", user.id),
  ])
  const memberBrands = (memberships ?? []).map((m: { brands: unknown }) => m.brands).filter(Boolean)
  // dedupe by id
  const all = [...(owned ?? []), ...memberBrands]
  const seen = new Set<string>()
  const brands = all.filter((b) => {
    if (!b || seen.has(b.id)) return false
    seen.add(b.id); return true
  })
  return NextResponse.json({ brands })
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth

  const { name, slug, parent_brand_id = null, seed_preset = "default" } = await req.json()
  if (!name || !slug) return NextResponse.json({ error: "name+slug required" }, { status: 400 })

  // 1) Create brand
  const { data: brand, error: bErr } = await supabase.from("brands")
    .insert({ owner_id: user.id, name, slug, parent_brand_id }).select().single()
  if (bErr || !brand) return NextResponse.json({ error: bErr?.message ?? "insert failed" }, { status: 400 })

  // 2) Ensure global layers (core + semantic_global) exist for this owner.
  const { data: coreLayer } = await supabase.from("token_layers")
    .select("id").eq("owner_id", user.id).is("brand_id", null).eq("kind", "core").maybeSingle()
  if (!coreLayer) {
    const seed = PRESETS[seed_preset as keyof typeof PRESETS] ?? PRESETS.default
    await supabase.from("token_layers").insert([
      { owner_id: user.id, brand_id: null, kind: "core", payload: seed, version: 1, locked: true, updated_by: user.id },
      { owner_id: user.id, brand_id: null, kind: "semantic_global", payload: {}, version: 1, updated_by: user.id },
    ])
  }

  // 3) Create empty brand layers
  await supabase.from("token_layers").insert([
    { owner_id: user.id, brand_id: brand.id, kind: "semantic_brand", payload: {}, version: 1, updated_by: user.id },
    { owner_id: user.id, brand_id: brand.id, kind: "brand",          payload: {}, version: 1, updated_by: user.id },
  ])

  // 4) Owner becomes admin member implicitly via owner check; no row needed.
  return NextResponse.json({ brand })
}
