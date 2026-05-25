"use client"

import { create } from "zustand"
import { supabase } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean

  init: () => () => void
  signInWithEmail: (email: string, password: string) => Promise<string | null>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Pick<Profile, "display_name" | "avatar_url">>) => Promise<string | null>
  fetchProfile: (userId: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  init: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false })
      if (session?.user) get().fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false })
      if (session?.user) {
        get().fetchProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })

    return () => subscription.unsubscribe()
  },

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", userId)
      .single()
    if (data) set({ profile: data as Profile })
  },

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  },

  signUpWithEmail: async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return error.message
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: displayName,
      })
    }
    return null
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    })
    return error?.message ?? null
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },

  updateProfile: async (data) => {
    const { user } = get()
    if (!user) return "Not authenticated"
    const { error } = await supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", user.id)
    if (error) return error.message
    set((s) => ({ profile: s.profile ? { ...s.profile, ...data } : null }))
    return null
  },
}))
