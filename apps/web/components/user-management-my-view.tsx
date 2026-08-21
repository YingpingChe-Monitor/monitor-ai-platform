"use client"

import { useTranslations } from "next-intl"
import { ShieldCheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { getCustomers, getProjects, type Session } from "@/lib/auth"

// Single-page view for Key User / 普通用户: they have no management rights,
// but they can see their own permissions and change their own password
// (the Account dialog in the user menu covers the password part).
export function UserManagementMyView({ session }: { session: Session }) {
  const t = useTranslations("UserManagement")
  const user = session.user
  const customers = getCustomers()
  const projects = getProjects()

  const customerName = customers.find((c) => c.id === user.customerId)?.name ?? "—"
  const projectNames =
    user.projectIds
      ?.map((pid) => projects.find((p) => p.id === pid)?.name)
      .filter(Boolean)
      .join("、") ?? "—"

  const roleLabel =
    user.role === "key-user" ? t("roleKeyUser") : t("roleRegular")

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheckIcon />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{t("myViewTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("myViewDescription")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("myPermissionsTitle")}</CardTitle>
          <CardDescription>{t("myPermissionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableBody>
                <TableRow>
                  <TableHead className="w-36">{t("colName")}</TableHead>
                  <TableCell className="font-medium">{user.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>{t("colUsername")}</TableHead>
                  <TableCell>{user.username}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>{t("colEmail")}</TableHead>
                  <TableCell>{user.email}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>{t("colRole")}</TableHead>
                  <TableCell>
                    <Badge variant="secondary">{roleLabel}</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>{t("colCustomer")}</TableHead>
                  <TableCell>{customerName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>{t("colProject")}</TableHead>
                  <TableCell>{projectNames}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{t("myPermissionsNote")}</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              <li>{t("permViewOwnProfile")}</li>
              <li>{t("permChangeOwnPassword")}</li>
              <li>{t("permViewAssignedProjects")}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
