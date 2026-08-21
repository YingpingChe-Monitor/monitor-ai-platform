import { UserManagement } from "@/components/user-management"

// User management page: three tabs (成员/邀请/安全) for managers, a single
// "my permissions" view for Key User / 普通用户. AuthGuard protection comes
// automatically from app/(app)/layout.tsx.
export default function UserManagementPage() {
  return <UserManagement />
}
