"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    const unsubscribe = init()
    return unsubscribe
  }, [init])

  return <>{children}</>
}
