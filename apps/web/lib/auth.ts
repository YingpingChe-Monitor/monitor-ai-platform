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
const PASSWORD_OVERRIDE_KEY = "monitor_g5_password_overrides"

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; error: "user-not-found" | "wrong-password" }

// Password changes are stored as per-user overrides in localStorage so the
// mock login flow stays refresh-proof without mutating MOCK_USERS.
function getPasswordOverride(username: string): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(PASSWORD_OVERRIDE_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, string>
    return map[username] ?? null
  } catch {
    return null
  }
}

function effectivePassword(user: (typeof MOCK_USERS)[number]): string {
  return getPasswordOverride(user.username) ?? user.password
}

export function login(username: string, password: string): LoginResult {
  const user = MOCK_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  )
  if (!user) return { ok: false, error: "user-not-found" }
  if (effectivePassword(user) !== password) {
    return { ok: false, error: "wrong-password" }
  }

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

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: "not-logged-in" | "user-not-found" | "wrong-current-password" }

export function changePassword(
  currentPassword: string,
  newPassword: string
): ChangePasswordResult {
  if (typeof window === "undefined") return { ok: false, error: "not-logged-in" }
  const session = getSession()
  if (!session) return { ok: false, error: "not-logged-in" }
  const user = MOCK_USERS.find((u) => u.username === session.user.username)
  if (!user) return { ok: false, error: "user-not-found" }
  if (effectivePassword(user) !== currentPassword) {
    return { ok: false, error: "wrong-current-password" }
  }

  const map: Record<string, string> = {}
  try {
    const raw = localStorage.getItem(PASSWORD_OVERRIDE_KEY)
    if (raw) Object.assign(map, JSON.parse(raw))
  } catch {
    // start fresh
  }
  map[user.username] = newPassword
  localStorage.setItem(PASSWORD_OVERRIDE_KEY, JSON.stringify(map))
  return { ok: true }
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
