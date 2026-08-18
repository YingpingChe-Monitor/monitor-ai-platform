"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "@/lib/auth"

// Client-side route guard: localStorage cannot be read by proxy.ts (server),
// so the guard must live in a client component. Any page wrapped with this
// redirects to /login when no session exists. Until the check completes we
// render nothing to avoid flashing protected content.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getSession()) {
      router.replace("/login")
    } else {
      // Reading localStorage is an external-system check that can only run
      // client-side; flipping the render flag here is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true)
    }
  }, [router])

  if (!ready) return null
  return <>{children}</>
}

// Inverse guard for the login page: an already-signed-in user goes straight
// back to the dashboard. Renders children immediately (server can't know the
// localStorage session, so the login form must be SSR'd) and only redirects
// client-side when a session is actually found.
export function GuestOnlyGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (getSession()) {
      router.replace("/")
    }
  }, [router])

  return <>{children}</>
}
