// Mock authentication for the login prototype.
// Session lives in localStorage (client-only, refresh-proof), which is the
// whole point of the prototype: no backend, but a working login flow.
// Swap this module for a real API call when the backend lands.

export type SessionUser = {
  username: string
  name: string
  email: string
  avatar?: string
}

export type Session = {
  user: SessionUser
  loggedInAt: string
}

// Mock user table — array on purpose so more roles are a one-line addition.
export const MOCK_USERS: (SessionUser & { password: string })[] = [
  {
    username: "admin",
    password: "123456",
    name: "管理员",
    email: "admin@monitor-g5.local",
  },
]

const SESSION_KEY = "monitor_g5_session"

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; error: "user-not-found" | "wrong-password" }

export function login(username: string, password: string): LoginResult {
  const user = MOCK_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  )
  if (!user) return { ok: false, error: "user-not-found" }
  if (user.password !== password) return { ok: false, error: "wrong-password" }

  const session: Session = {
    user: {
      username: user.username,
      name: user.name,
      email: user.email,
    },
    loggedInAt: new Date().toISOString(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return { ok: true, session }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    return parsed.user ? parsed : null
  } catch {
    return null
  }
}

export function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}
