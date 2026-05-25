// Server-side Supabase client bound to the caller's JWT (from Authorization
// header). Reads/writes go through RLS using the user's identity.
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export function supabaseFromRequest(req: NextRequest): { supabase: SupabaseClient; token: string | null } {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  const supabase = createClient(url, anon, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return { supabase, token }
}

export async function requireUser(req: NextRequest) {
  const { supabase, token } = supabaseFromRequest(req)
  if (!token) return { error: "unauthorized" as const, status: 401 as const }
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return { error: "unauthorized" as const, status: 401 as const }
  return { supabase, user: data.user }
}
