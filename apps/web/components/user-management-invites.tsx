"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  ClipboardCopyIcon,
  LinkIcon,
  Loader2Icon,
  UserPlusIcon,
  XCircleIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  createInvite,
  getCustomers,
  getInvites,
  getProjects,
  inviteEffectiveStatus,
  revokeInvite,
  type Invite,
  type InviteStatus,
  type Session,
} from "@/lib/auth"

type InviteFormError = "required" | "email-taken" | "forbidden" | null

// Roles an inviter may grant. Customer PMs may only invite Key User / 普通用户
// inside their own project; superadmin / internal users may also create
// customer PMs.
const INVITABLE_ROLES = [
  { value: "key-user", labelKey: "roleKeyUser" },
  { value: "regular", labelKey: "roleRegular" },
  { value: "customer-pm", labelKey: "roleCustomerPm" },
] as const

export function UserManagementInvites({ session }: { session: Session }) {
  const t = useTranslations("UserManagement")
  const actor = session.user
  const isInternal = actor.role === "superadmin" || actor.role === "internal"

  const customers = getCustomers()
  const projects = getProjects()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<(typeof INVITABLE_ROLES)[number]["value"] | "">("")
  const [customerId, setCustomerId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [error, setError] = useState<InviteFormError>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lastLink, setLastLink] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[]>(() => getInvites())

  // Customer PM scope: locked to their own customer + project, no PM role.
  const lockedCustomer = !isInternal ? actor.customerId ?? "" : ""
  const lockedProject = !isInternal ? (actor.projectIds?.[0] ?? "") : ""
  const effectiveCustomerId = isInternal ? customerId : lockedCustomer
  const effectiveProjectId = isInternal ? projectId : lockedProject

  const availableProjects = useMemo(
    () => projects.filter((p) => p.customerId === effectiveCustomerId),
    [projects, effectiveCustomerId]
  )

  const invitableRoles = useMemo(
    () =>
      INVITABLE_ROLES.filter((r) => isInternal || r.value !== "customer-pm"),
    [isInternal]
  )

  const projectName = (id?: string) =>
    projects.find((p) => p.id === id)?.name ?? "—"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !name.trim() || !role || !effectiveCustomerId || !effectiveProjectId) {
      setError("required")
      return
    }
    setError(null)
    setSubmitting(true)
    // Small delay so the loading state is visible (mock auth is synchronous).
    window.setTimeout(() => {
      const result = createInvite({
        email,
        name,
        role: role as "customer-pm" | "key-user" | "regular",
        customerId: effectiveCustomerId,
        projectId: effectiveProjectId,
      })
      setSubmitting(false)
      if (!result.ok) {
        setError(
          result.error === "email-taken"
            ? "email-taken"
            : result.error === "missing-project"
              ? "required"
              : "forbidden"
        )
        return
      }
      toast.success(t("toastInviteCreated"))
      setLastLink(result.link)
      setEmail("")
      setName("")
      setRole("")
      if (isInternal) {
        setCustomerId("")
        setProjectId("")
      }
      setInvites(getInvites())
    }, 500)
  }

  async function handleCopy(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      toast.success(t("linkCopied"))
    } catch {
      toast.error(t("copyFailed"))
    }
  }

  function handleRevoke(token: string) {
    revokeInvite(token)
    setInvites(getInvites())
    toast.success(t("toastInviteRevoked"))
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("inviteTitle")}</CardTitle>
          <CardDescription>{t("inviteDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field data-invalid={error === "required"}>
                <FieldLabel htmlFor="inv-email">{t("inviteEmail")}</FieldLabel>
                <Input
                  id="inv-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error === "required"}
                  placeholder={t("inviteEmailPlaceholder")}
                />
              </Field>
              <Field data-invalid={error === "required"}>
                <FieldLabel htmlFor="inv-name">{t("inviteName")}</FieldLabel>
                <Input
                  id="inv-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={error === "required"}
                  placeholder={t("inviteNamePlaceholder")}
                />
              </Field>
              <Field data-invalid={error === "required"}>
                <FieldLabel htmlFor="inv-role">{t("inviteRole")}</FieldLabel>
                <Select
                  value={role || null}
                  onValueChange={(v) => setRole((v ?? "") as typeof role)}
                >
                  <SelectTrigger id="inv-role" className="w-full">
                    <SelectValue placeholder={t("inviteRolePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {invitableRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {t(r.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {isInternal && (
                <Field data-invalid={error === "required"}>
                  <FieldLabel htmlFor="inv-customer">{t("inviteCustomer")}</FieldLabel>
                  <Select
                    value={customerId || null}
                    onValueChange={(v) => {
                      setCustomerId(v ?? "")
                      setProjectId("")
                    }}
                  >
                    <SelectTrigger id="inv-customer" className="w-full">
                      <SelectValue placeholder={t("inviteCustomerPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field data-invalid={error === "required"}>
                <FieldLabel htmlFor="inv-project">{t("inviteProject")}</FieldLabel>
                <Select
                  value={effectiveProjectId || null}
                  onValueChange={(v) => setProjectId(v ?? "")}
                  disabled={!isInternal && !lockedProject}
                >
                  <SelectTrigger id="inv-project" className="w-full">
                    <SelectValue placeholder={t("inviteProjectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {error && (
                <Field data-invalid>
                  <FieldDescription className="text-destructive">
                    {error === "required" && t("errorRequired")}
                    {error === "email-taken" && t("errorEmailTaken")}
                    {error === "forbidden" && t("errorForbidden")}
                  </FieldDescription>
                </Field>
              )}

              <Field>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2Icon data-icon="inline-start" className="animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    <>
                      <UserPlusIcon data-icon="inline-start" />
                      {t("generateLink")}
                    </>
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          {lastLink && (
            <div className="mt-4 flex flex-col gap-2 rounded-md border bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <LinkIcon className="text-muted-foreground" />
                {t("generatedLink")}
              </p>
              <code className="break-all rounded bg-background px-2 py-1 text-xs text-muted-foreground">
                {lastLink}
              </code>
              <Button variant="outline" size="sm" onClick={() => handleCopy(lastLink)}>
                <ClipboardCopyIcon data-icon="inline-start" />
                {t("copyLink")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("linkHint")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("inviteRecordsTitle")}</CardTitle>
          <CardDescription>{t("inviteRecordsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colInviteEmail")}</TableHead>
                  <TableHead>{t("colInviteRole")}</TableHead>
                  <TableHead>{t("colInviteProject")}</TableHead>
                  <TableHead>{t("colInviteStatus")}</TableHead>
                  <TableHead>{t("colInviteCreated")}</TableHead>
                  <TableHead>{t("colInviteExpires")}</TableHead>
                  <TableHead className="text-right">{t("colInviteActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => {
                  const status = inviteEffectiveStatus(invite)
                  return (
                    <TableRow key={invite.token}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>{t(inviteRoleLabelKey(invite.role))}</TableCell>
                      <TableCell>{projectName(invite.projectId)}</TableCell>
                      <TableCell>
                        <StatusBadge status={status} t={t} />
                      </TableCell>
                      <TableCell>{formatDate(invite.createdAt)}</TableCell>
                      <TableCell>{formatDate(invite.expiresAt)}</TableCell>
                      <TableCell className="text-right">
                        {status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(invite.token)}
                          >
                            <XCircleIcon data-icon="inline-start" />
                            {t("revoke")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {invites.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {t("emptyInvites")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function inviteRoleLabelKey(role: Invite["role"]) {
  return role === "customer-pm" ? "roleCustomerPm" : role === "key-user" ? "roleKeyUser" : "roleRegular"
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString()
}

function StatusBadge({
  status,
  t,
}: {
  status: InviteStatus
  t: (key: string) => string
}) {
  const variant =
    status === "pending"
      ? "secondary"
      : status === "used"
        ? "default"
        : status === "expired"
          ? "outline"
          : "destructive"
  const label =
    status === "pending"
      ? "invitePending"
      : status === "used"
        ? "inviteUsed"
        : status === "expired"
          ? "inviteExpired"
          : "inviteRevoked"
  return <Badge variant={variant}>{t(label)}</Badge>
}
