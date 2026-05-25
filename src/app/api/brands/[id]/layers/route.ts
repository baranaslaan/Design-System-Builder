import { NextResponse, type NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params

  // Pull global layers (brand_id = null) of the brand's OWNER, plus brand layers.
  const { data: brand } = await auth.supabase.from("brands").select("owner_id").eq("id", id).maybeSingle()
  if (!brand) return NextResponse.json({ error: "brand not found" }, { status: 404 })

  const [{ data: globalLayers }, { data: brandLayers }] = await Promise.all([
    auth.supabase.from("token_layers").select("*").eq("owner_id", brand.owner_id).is("brand_id", null),
    auth.supabase.from("token_layers").select("*").eq("brand_id", id),
  ])
  return NextResponse.json({ layers: [...(globalLayers ?? []), ...(brandLayers ?? [])] })
}
