import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"
import { resolveLayers } from "@/lib/brands/resolve"
import { computePermissions } from "@/lib/brands/perms"
import type { TokenLayer } from "@/types/brands"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params

  const { data: brand } = await auth.supabase.from("brands").select("owner_id").eq("id", id).maybeSingle()
  if (!brand) return NextResponse.json({ error: "brand not found" }, { status: 404 })

  const [{ data: globalLayers }, { data: brandLayers }, permsResult] = await Promise.all([
    auth.supabase.from("token_layers").select("*").eq("owner_id", brand.owner_id).is("brand_id", null),
    auth.supabase.from("token_layers").select("*").eq("brand_id", id),
    computePermissions(auth.supabase, id, auth.user.id),
  ])

  try {
    const layers = [...(globalLayers ?? []), ...(brandLayers ?? [])] as TokenLayer[]
    const resolved = resolveLayers(layers)
    return NextResponse.json({ resolved, permissions: permsResult.perms, layers })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "resolve failed" }, { status: 500 })
  }
}
