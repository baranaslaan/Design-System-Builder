// Compute a user's effective permissions for a brand from owner + member role.
import type { SupabaseClient } from "@supabase/supabase-js"
import type { BrandPermissions, Role } from "@/types/brands"

export async function computePermissions(
  supabase: SupabaseClient, brandId: string, userId: string,
): Promise<{ perms: BrandPermissions; isOwner: boolean; role: Role | null }> {
  const { data: brand } = await supabase.from("brands").select("owner_id").eq("id", brandId).maybeSingle()
  const isOwner = brand?.owner_id === userId

  let role: Role | null = null
  if (!isOwner) {
    const { data: m } = await supabase.from("brand_members").select("role").eq("brand_id", brandId).eq("user_id", userId).maybeSingle()
    role = (m?.role as Role) ?? null
  }

  const perms: BrandPermissions = {
    canEditCore:            isOwner,
    canEditSemanticGlobal:  isOwner,
    canEditSemanticBrand:   isOwner || role === "admin",
    canEditBrand:           isOwner || role === "admin" || role === "editor",
    canResolveConflicts:    isOwner || role === "admin",
  }
  return { perms, isOwner, role }
}
