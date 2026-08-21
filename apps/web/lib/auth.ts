// Mock authentication + user directory for the prototype.
// Everything lives in localStorage (client-only, refresh-proof): the whole
// point of the prototype is no backend but a working auth flow.
// Swap this module for a real API call when the backend lands.

// ---------------------------------------------------------------------------
// Domain model
// ---------------------------------------------------------------------------

export type Role =
  | "superadmin" // 超级管理员
  | "internal" // 内部用户（实施/开发/售后）
  | "customer-pm" // 客户项目经理
  | "key-user" // Key User
  | "regular" // 普通用户

export type InternalDepartment = "implementation" | "development" | "after-sales"

export type UserStatus = "active" | "inactive" | "pending"

export type Customer = {
  id: string
  name: string
}

export type Project = {
  id: string
  name: string
  customerId: string
  pmUserId: string | null // 每个项目的客户项目经理可以不同
}

export type User = {
  username: string
  password: string
  name: string
  email: string
  role: Role
  department?: InternalDepartment // 仅内部用户
  customerId?: string // 客户用户所属客户
  projectIds?: string[] // 客户用户所属项目
  status: UserStatus
  avatar?: string
}

export type InviteStatus = "pending" | "used" | "expired" | "revoked"

export type Invite = {
  token: string
  email: string
  name: string
  role: "customer-pm" | "key-user" | "regular"
  customerId: string
  projectId: string
  status: InviteStatus
  createdAt: string
  expiresAt: string // createdAt + 7 days
  createdBy: string
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

export const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", name: "华信科技" },
  { id: "c2", name: "南方电力" },
  { id: "c3", name: "东湖智造" },
]

export const MOCK_PROJECTS: Project[] = [
  { id: "p1", name: "华信 MES 监控", customerId: "c1", pmUserId: "pm1" },
  { id: "p2", name: "华信设备管理", customerId: "c1", pmUserId: "pm2" },
  { id: "p3", name: "南方电力 SCADA", customerId: "c2", pmUserId: "pm3" },
  { id: "p4", name: "东湖产线监控", customerId: "c3", pmUserId: "pm4" },
]

// Seed user table — array on purpose so more roles are a one-line addition.
// The demo superadmin keeps the original admin / 123456 credentials.
export const MOCK_USERS: User[] = [
  {
    username: "admin",
    password: "123456",
    name: "管理员",
    email: "admin@monitor-g5.local",
    role: "superadmin",
    status: "active",
  },
  {
    username: "zhangsan",
    password: "123456",
    name: "张三",
    email: "zhangsan@monitor-g5.local",
    role: "internal",
    department: "implementation",
    status: "active",
  },
  {
    username: "lisi",
    password: "123456",
    name: "李四",
    email: "lisi@monitor-g5.local",
    role: "internal",
    department: "development",
    status: "active",
  },
  {
    username: "wangwu",
    password: "123456",
    name: "王五",
    email: "wangwu@monitor-g5.local",
    role: "internal",
    department: "after-sales",
    status: "active",
  },
  {
    username: "pm1",
    password: "123456",
    name: "陈静",
    email: "chenjing@huaxin.com",
    role: "customer-pm",
    customerId: "c1",
    projectIds: ["p1"],
    status: "active",
  },
  {
    username: "pm2",
    password: "123456",
    name: "刘洋",
    email: "liuyang@huaxin.com",
    role: "customer-pm",
    customerId: "c1",
    projectIds: ["p2"],
    status: "active",
  },
  {
    username: "pm3",
    password: "123456",
    name: "赵敏",
    email: "zhaomin@nanfang-power.com",
    role: "customer-pm",
    customerId: "c2",
    projectIds: ["p3"],
    status: "active",
  },
  {
    username: "pm4",
    password: "123456",
    name: "孙丽",
    email: "sunli@donghu-mfg.com",
    role: "customer-pm",
    customerId: "c3",
    projectIds: ["p4"],
    status: "active",
  },
  {
    username: "ku1",
    password: "123456",
    name: "周涛",
    email: "zhoutao@huaxin.com",
    role: "key-user",
    customerId: "c1",
    projectIds: ["p1"],
    status: "active",
  },
  {
    username: "ku2",
    password: "123456",
    name: "吴强",
    email: "wuqiang@nanfang-power.com",
    role: "key-user",
    customerId: "c2",
    projectIds: ["p3"],
    status: "active",
  },
  {
    username: "user1",
    password: "123456",
    name: "郑晓",
    email: "zhengxiao@huaxin.com",
    role: "regular",
    customerId: "c1",
    projectIds: ["p1", "p2"],
    status: "active",
  },
  {
    username: "user2",
    password: "123456",
    name: "冯军",
    email: "fengjun@donghu-mfg.com",
    role: "regular",
    customerId: "c3",
    projectIds: ["p4"],
    status: "inactive",
  },
]

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const SESSION_KEY = "monitor_g5_session"
const PASSWORD_OVERRIDE_KEY = "monitor_g5_password_overrides"
const USERS_OVERRIDE_KEY = "monitor_g5_users_overrides" // 新增/修改的用户（种子外的持久层）
const INVITES_KEY = "monitor_g5_invites"
const CUSTOMERS_OVERRIDE_KEY = "monitor_g5_customers" // 运行时创建的客户（持久层）
const PROJECTS_OVERRIDE_KEY = "monitor_g5_projects" // 运行时创建的项目（持久层）

// Session lifetime used by the token-refresh demo (30 minutes).
export const SESSION_TTL_MS = 30 * 60 * 1000
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// ---------------------------------------------------------------------------
// User directory (seed + localStorage overrides)
// ---------------------------------------------------------------------------

export function getUsers(): User[] {
  const overrides = readJson<Record<string, Partial<User>>>(USERS_OVERRIDE_KEY)
  if (!overrides) return MOCK_USERS
  // Seed users merged with their overrides…
  const merged = MOCK_USERS.map((u) => ({ ...u, ...(overrides[u.username] ?? {}) }))
  // …plus users created at runtime (internal accounts, invite activations),
  // which only exist in the override store.
  for (const [username, patch] of Object.entries(overrides)) {
    if (!MOCK_USERS.some((u) => u.username === username)) {
      merged.push({ ...(patch as User), username })
    }
  }
  return merged
}

export function getCustomers(): Customer[] {
  const overrides = readJson<Record<string, Customer>>(CUSTOMERS_OVERRIDE_KEY)
  if (!overrides) return MOCK_CUSTOMERS
  return [...MOCK_CUSTOMERS, ...Object.values(overrides)]
}

export function getProjects(): Project[] {
  const overrides = readJson<Record<string, Project>>(PROJECTS_OVERRIDE_KEY)
  if (!overrides) return MOCK_PROJECTS
  return [...MOCK_PROJECTS, ...Object.values(overrides)]
}

// Runtime-created customers / projects get UUIDs (database-friendly: unique,
// no auto-increment coupling; the seed keeps its short ids so demo data and
// runtime data never collide).
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export type CreateCustomerResult =
  | { ok: true; customer: Customer; created: boolean }
  | { ok: false; error: "empty-name" }

/** Find a customer by exact name (trim + case-insensitive). */
export function findCustomerByName(name: string): Customer | undefined {
  const q = name.trim().toLowerCase()
  if (!q) return undefined
  return getCustomers().find((c) => c.name.trim().toLowerCase() === q)
}

/**
 * Customers whose name contains the query or vice versa (trim +
 * case-insensitive) — used to warn about near-duplicates before creating.
 */
export function findSimilarCustomers(name: string): Customer[] {
  const q = name.trim().toLowerCase()
  if (!q) return []
  return getCustomers().filter((c) => {
    const n = c.name.trim().toLowerCase()
    if (n === q) return false // exact match is handled by findCustomerByName
    return n.includes(q) || q.includes(n)
  })
}

/**
 * Create a customer if one with the same name (trim + case-insensitive) does
 * not already exist; returns the existing one otherwise.
 */
export function createCustomer(name: string): CreateCustomerResult {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: "empty-name" }
  const existing = findCustomerByName(trimmed)
  if (existing) return { ok: true, customer: existing, created: false }

  const customer: Customer = { id: newId(), name: trimmed }
  const overrides = readJson<Record<string, Customer>>(CUSTOMERS_OVERRIDE_KEY) ?? {}
  overrides[customer.id] = customer
  writeJson(CUSTOMERS_OVERRIDE_KEY, overrides)
  return { ok: true, customer, created: true }
}

export type CreateProjectResult =
  | { ok: true; project: Project; created: boolean }
  | { ok: false; error: "empty-name" | "customer-not-found" }

/** Find a project of a customer by exact name (trim + case-insensitive). */
export function findProjectByName(
  customerId: string,
  name: string
): Project | undefined {
  const q = name.trim().toLowerCase()
  if (!q) return undefined
  return getProjects().find(
    (p) => p.customerId === customerId && p.name.trim().toLowerCase() === q
  )
}

/**
 * Create a project under a customer if one with the same name does not
 * already exist there; returns the existing one otherwise.
 */
export function createProject(
  customerId: string,
  name: string
): CreateProjectResult {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: "empty-name" }
  if (!getCustomers().some((c) => c.id === customerId)) {
    return { ok: false, error: "customer-not-found" }
  }
  const existing = findProjectByName(customerId, trimmed)
  if (existing) return { ok: true, project: existing, created: false }

  const project: Project = {
    id: newId(),
    name: trimmed,
    customerId,
    pmUserId: null, // 新项目尚无项目经理，由后续邀请/指派产生
  }
  const overrides = readJson<Record<string, Project>>(PROJECTS_OVERRIDE_KEY) ?? {}
  overrides[project.id] = project
  writeJson(PROJECTS_OVERRIDE_KEY, overrides)
  return { ok: true, project, created: true }
}

function saveUserOverride(username: string, patch: Partial<User>) {
  const overrides =
    readJson<Record<string, Partial<User>>>(USERS_OVERRIDE_KEY) ?? {}
  overrides[username] = { ...(overrides[username] ?? {}), ...patch }
  writeJson(USERS_OVERRIDE_KEY, overrides)
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type SessionUser = {
  username: string
  name: string
  email: string
  role: Role
  department?: InternalDepartment
  customerId?: string
  projectIds?: string[]
  avatar?: string
}

export type Session = {
  user: SessionUser
  loggedInAt: string
  expiresAt: string
}

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; error: "user-not-found" | "wrong-password" | "inactive" }

// Password changes are stored as per-user overrides in localStorage so the
// mock login flow stays refresh-proof without mutating the seed table.
function getPasswordOverride(username: string): string | null {
  const map = readJson<Record<string, string>>(PASSWORD_OVERRIDE_KEY)
  return map?.[username] ?? null
}

function effectivePassword(user: User): string {
  return getPasswordOverride(user.username) ?? user.password
}

function buildSession(user: User): Session {
  const now = Date.now()
  return {
    user: {
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      customerId: user.customerId,
      projectIds: user.projectIds,
    },
    loggedInAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  }
}

export function login(username: string, password: string): LoginResult {
  const user = getUsers().find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  )
  if (!user) return { ok: false, error: "user-not-found" }
  if (user.status === "inactive") return { ok: false, error: "inactive" }
  if (effectivePassword(user) !== password) {
    return { ok: false, error: "wrong-password" }
  }

  const session = buildSession(user)
  writeJson(SESSION_KEY, session)
  return { ok: true, session }
}

export function getSession(): Session | null {
  const session = readJson<Session>(SESSION_KEY)
  return session?.user ? session : null
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

// ---------------------------------------------------------------------------
// Token auto-refresh (story 8)
// ---------------------------------------------------------------------------

export type RefreshResult =
  | { status: "ok" } // 未到期
  | { status: "refreshed" } // 到期后静默续期成功
  | { status: "expired" } // 续期失败（用户已停用）→ 应登出

export function refreshSessionIfNeeded(): RefreshResult {
  const session = getSession()
  if (!session) return { status: "expired" }
  const expiresAt = new Date(session.expiresAt).getTime()
  if (Date.now() <= expiresAt) return { status: "ok" }

  // Expired: try a silent refresh with the refresh token (mock: the user
  // record must still exist and be active).
  const user = getUsers().find((u) => u.username === session.user.username)
  if (!user || user.status !== "active") {
    logout()
    return { status: "expired" }
  }
  const refreshed = buildSession(user)
  writeJson(SESSION_KEY, refreshed)
  return { status: "refreshed" }
}

/** Demo helper: force the session to expire so story 8 can be shown live. */
export function simulateExpiry() {
  const session = getSession()
  if (!session) return
  writeJson(SESSION_KEY, {
    ...session,
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  })
}

// ---------------------------------------------------------------------------
// Own password change (existing Account dialog keeps working)
// ---------------------------------------------------------------------------

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: "not-logged-in" | "user-not-found" | "wrong-current-password" }

export function changePassword(
  currentPassword: string,
  newPassword: string
): ChangePasswordResult {
  const session = getSession()
  if (!session) return { ok: false, error: "not-logged-in" }
  const user = getUsers().find((u) => u.username === session.user.username)
  if (!user) return { ok: false, error: "user-not-found" }
  if (effectivePassword(user) !== currentPassword) {
    return { ok: false, error: "wrong-current-password" }
  }

  const map = readJson<Record<string, string>>(PASSWORD_OVERRIDE_KEY) ?? {}
  map[user.username] = newPassword
  writeJson(PASSWORD_OVERRIDE_KEY, map)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Superadmin: create internal account (story 3)
// ---------------------------------------------------------------------------

export type CreateInternalUserResult =
  | { ok: true; user: User }
  | { ok: false; error: "not-superadmin" | "username-taken" | "invalid-role" }

export function createInternalUser(input: {
  username: string
  name: string
  email: string
  department: InternalDepartment
  password: string
}): CreateInternalUserResult {
  const session = getSession()
  if (!session || session.user.role !== "superadmin") {
    return { ok: false, error: "not-superadmin" }
  }
  const username = input.username.trim().toLowerCase()
  if (getUsers().some((u) => u.username.toLowerCase() === username)) {
    return { ok: false, error: "username-taken" }
  }

  const user: User = {
    username,
    password: input.password,
    name: input.name.trim(),
    email: input.email.trim(),
    role: "internal",
    department: input.department,
    status: "active",
  }
  saveUserOverride(username, user)
  return { ok: true, user }
}

// ---------------------------------------------------------------------------
// Enable / disable users (stories 4/5), admin password reset (story 9)
// ---------------------------------------------------------------------------

export type SetUserStatusResult =
  | { ok: true }
  | { ok: false; error: "user-not-found" | "forbidden" | "self-disable" }

export function setUserStatus(
  username: string,
  status: "active" | "inactive"
): SetUserStatusResult {
  const session = getSession()
  if (!session) return { ok: false, error: "forbidden" }
  const actor = session.user
  const target = getUsers().find((u) => u.username === username)
  if (!target) return { ok: false, error: "user-not-found" }
  if (username === actor.username) return { ok: false, error: "self-disable" }

  const canManage =
    actor.role === "superadmin" ||
    actor.role === "internal" ||
    (actor.role === "customer-pm" &&
      target.role !== "customer-pm" &&
      target.role !== "internal" &&
      target.role !== "superadmin" &&
      target.customerId === actor.customerId &&
      (target.projectIds ?? []).some((pid) => (actor.projectIds ?? []).includes(pid)))

  if (!canManage) return { ok: false, error: "forbidden" }

  saveUserOverride(username, { status })
  // A disabled user loses the session on the next refresh.
  return { ok: true }
}

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: "not-superadmin" | "user-not-found" | "too-short" }

/** Superadmin resets any user's password (decision 2026-08, replaces #39). */
export function resetPassword(username: string, newPassword: string): ResetPasswordResult {
  const session = getSession()
  if (!session || session.user.role !== "superadmin") {
    return { ok: false, error: "not-superadmin" }
  }
  if (newPassword.length < 6) return { ok: false, error: "too-short" }
  const target = getUsers().find((u) => u.username === username)
  if (!target) return { ok: false, error: "user-not-found" }

  const map = readJson<Record<string, string>>(PASSWORD_OVERRIDE_KEY) ?? {}
  map[username] = newPassword
  writeJson(PASSWORD_OVERRIDE_KEY, map)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Invitations (stories 4/5/6): one-time link, 7-day expiry, revocable
// ---------------------------------------------------------------------------

export function getInvites(): Invite[] {
  return readJson<Invite[]>(INVITES_KEY) ?? []
}

function saveInvites(invites: Invite[]) {
  writeJson(INVITES_KEY, invites)
}

export type CreateInviteResult =
  | { ok: true; invite: Invite; link: string }
  | { ok: false; error: "forbidden" | "email-taken" | "missing-project" }

export function createInvite(input: {
  email: string
  name: string
  role: "customer-pm" | "key-user" | "regular"
  customerId: string
  projectId: string
}): CreateInviteResult {
  const session = getSession()
  if (!session) return { ok: false, error: "forbidden" }
  const actor = session.user

  const project = getProjects().find((p) => p.id === input.projectId)
  if (!project) return { ok: false, error: "missing-project" }

  // Permission matrix: superadmin/internal may invite anywhere; a customer PM
  // may only invite Key User / 普通用户 inside their own project.
  const isInternal =
    actor.role === "superadmin" || actor.role === "internal"
  const isOwnProjectPm =
    actor.role === "customer-pm" &&
    (actor.projectIds ?? []).includes(input.projectId) &&
    input.role !== "customer-pm"
  if (!isInternal && !isOwnProjectPm) return { ok: false, error: "forbidden" }

  if (
    getUsers().some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())
  ) {
    return { ok: false, error: "email-taken" }
  }

  const token =
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  const now = Date.now()
  const invite: Invite = {
    token,
    email: input.email.trim(),
    name: input.name.trim(),
    role: input.role,
    customerId: input.customerId,
    projectId: input.projectId,
    status: "pending",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INVITE_TTL_MS).toISOString(),
    createdBy: actor.username,
  }
  saveInvites([invite, ...getInvites()])

  // The link is copied by the inviter — the system never sends email.
  const link = `${window.location.origin}/invite?token=${token}`
  return { ok: true, invite, link }
}

export function revokeInvite(token: string) {
  saveInvites(
    getInvites().map((inv) =>
      inv.token === token ? { ...inv, status: "revoked" } : inv
    )
  )
}

/** Effective status, honouring the 7-day expiry. */
export function inviteEffectiveStatus(invite: Invite): InviteStatus {
  if (invite.status !== "pending") return invite.status
  if (Date.now() > new Date(invite.expiresAt).getTime()) return "expired"
  return "pending"
}

export type ActivateInviteResult =
  | { ok: true }
  | { ok: false; error: "not-found" | "used" | "expired" | "revoked" | "too-short" }

/** Landing page: first-time password setup activates the account (story 6). */
export function activateInvite(token: string, password: string): ActivateInviteResult {
  const invites = getInvites()
  const invite = invites.find((inv) => inv.token === token)
  if (!invite) return { ok: false, error: "not-found" }
  const status = inviteEffectiveStatus(invite)
  if (status === "used") return { ok: false, error: "used" }
  if (status === "expired") return { ok: false, error: "expired" }
  if (status === "revoked") return { ok: false, error: "revoked" }
  if (password.length < 6) return { ok: false, error: "too-short" }

  const username =
    invite.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() ||
    `user${Math.random().toString(36).slice(2, 6)}`

  saveUserOverride(username, {
    username,
    password,
    name: invite.name,
    email: invite.email,
    role: invite.role,
    customerId: invite.customerId,
    projectIds: [invite.projectId],
    status: "active",
  })
  saveInvites(
    invites.map((inv) =>
      inv.token === token ? { ...inv, status: "used" } : inv
    )
  )
  return { ok: true }
}
