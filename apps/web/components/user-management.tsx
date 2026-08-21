"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { RefreshCwIcon, TimerResetIcon, UsersIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getSession,
  getUsers,
  refreshSessionIfNeeded,
  simulateExpiry,
  type Session,
  type User,
} from "@/lib/auth"
import { UserManagementMembers } from "@/components/user-management-members"
import { UserManagementInvites } from "@/components/user-management-invites"
import { UserManagementSecurity } from "@/components/user-management-security"
import { UserManagementMyView } from "@/components/user-management-my-view"

// Managers see the three-tab page; Key User / 普通用户 see a single
// "my permissions" view (their own roles/projects + change own password).
const MANAGER_ROLES = ["superadmin", "internal", "customer-pm"] as const

export function UserManagement() {
  const t = useTranslations("UserManagement")
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    // Reading localStorage is an external-system check that can only run
    // client-side; flipping these flags here is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(getSession())
    setUsers(getUsers())
  }, [])

  const refreshUsers = useCallback(() => setUsers(getUsers()), [])

  if (!session) return null

  const isManager = MANAGER_ROLES.includes(
    session.user.role as (typeof MANAGER_ROLES)[number]
  )
  if (!isManager) {
    return <UserManagementMyView session={session} />
  }

  const isSuperadmin = session.user.role === "superadmin"

  // Story 8 demo: force the session to expire, then run the same silent
  // renewal the AuthGuard performs on boot.
  function handleSimulateExpiry() {
    simulateExpiry()
    const result = refreshSessionIfNeeded()
    if (result.status === "expired") {
      router.replace("/login")
      return
    }
    toast.success(t("sessionRefreshed"))
    setSession(getSession())
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UsersIcon />
          </span>
          <div>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSimulateExpiry}>
          <TimerResetIcon data-icon="inline-start" />
          {t("simulateExpiry")}
        </Button>
      </div>

      <Tabs defaultValue="members" className="flex-1">
        <TabsList>
          <TabsTrigger value="members">{t("tabMembers")}</TabsTrigger>
          <TabsTrigger value="invites">{t("tabInvites")}</TabsTrigger>
          {isSuperadmin && (
            <TabsTrigger value="security">{t("tabSecurity")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <UserManagementMembers
            session={session}
            users={users}
            onRefresh={refreshUsers}
          />
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <UserManagementInvites session={session} />
        </TabsContent>

        {isSuperadmin && (
          <TabsContent value="security" className="mt-4">
            <UserManagementSecurity session={session} users={users} />
          </TabsContent>
        )}
      </Tabs>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <RefreshCwIcon className="text-muted-foreground" />
            {t("refreshHintTitle")}
          </CardTitle>
          <CardDescription>{t("refreshHint")}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("refreshHintDetail")}
        </CardContent>
      </Card>
    </div>
  )
}
