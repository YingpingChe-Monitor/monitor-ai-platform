import type { Session } from "@/lib/auth"

export type CustomerAccess = {
  /** superadmin / internal — read and write every customer. */
  canManageAll: boolean
  /** customer-pm / key-user / regular — read own customer only. */
  canView: (customerId: string) => boolean
}

/**
 * Access rules for the 客户 (Customers) feature:
 * - superadmin / internal: read + write any customer.
 * - customer-pm / key-user / regular: read-only on customers they belong to
 *   (session.user.customerId), nothing else is visible or editable.
 * Mock auth is client-side (localStorage) — real enforcement belongs to the
 * future backend; this mirrors the rules for the prototype.
 */
export function getCustomerAccess(session: Session | null): CustomerAccess {
  if (!session) return { canManageAll: false, canView: () => false }
  const user = session.user
  const canManageAll = user.role === "superadmin" || user.role === "internal"
  return {
    canManageAll,
    canView: (customerId: string) => canManageAll || user.customerId === customerId,
  }
}
