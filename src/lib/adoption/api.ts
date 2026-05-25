// Client helper: hits /api/adoption/* with the user's Supabase access token.
import { supabase } from "@/lib/supabase/client"

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const t = data.session?.access_token
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: await authHeaders(), cache: "no-store" })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

export async function apiSend<T>(url: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method, headers: await authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}
