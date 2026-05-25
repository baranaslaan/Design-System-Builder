import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; avatar_url: string | null; updated_at: string }
        Insert: { id: string; display_name?: string | null; avatar_url?: string | null }
        Update: { display_name?: string | null; avatar_url?: string | null; updated_at?: string }
      }
      token_sets: {
        Row: { id: string; user_id: string; name: string; tokens: unknown; created_at: string; updated_at: string }
        Insert: { user_id: string; name: string; tokens: unknown }
        Update: { name?: string; tokens?: unknown; updated_at?: string }
      }
      figma_links: {
        Row: {
          id: string
          user_id: string
          file_key: string
          file_name: string | null
          baseline_leaves: unknown
          last_synced_at: string
        }
        Insert: { user_id: string; file_key: string; file_name?: string | null; baseline_leaves: unknown }
        Update: { file_name?: string | null; baseline_leaves?: unknown; last_synced_at?: string }
      }
      sync_logs: {
        Row: {
          id: string
          user_id: string
          file_key: string
          direction: "pull" | "push" | "sync"
          conflicts_count: number
          changes: unknown
          error: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          file_key: string
          direction: "pull" | "push" | "sync"
          conflicts_count?: number
          changes: unknown
          error?: string | null
        }
        Update: never
      }
    }
  }
}
