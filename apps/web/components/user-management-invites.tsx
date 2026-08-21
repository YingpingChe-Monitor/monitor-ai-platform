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

import { CreatableCombobox } from "@/components/creatable-combobox"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
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
  createCustomer,
  createInvite,
  createProject,
  findCustomerByName,
  findProjectByName,
  findSimilarCustomers,
  getCustomers,
  getInvites,
  getProjects,
  inviteEffectiveStatus,
  revokeInvite,
  type Invite,
  type InviteStatus,
  type Session,
} from "@/lib/auth"

type InviteFormError =
  | "required"
  | "invalid-email"
  | "email-taken"
  | "forbidden"
  | null

// Per-field invalid flags — only fields that are missing/malformed get the
// red outline; already-filled fields stay untouched.
type InvalidFields = {
  email?: boolean
  name?: boolean
  role?: boolean
  customer?: boolean
  project?: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// What the confirm dialog must create before the invite can be sent.
type PendingCreation =
  | {
      kind: "customer" // 新客户 + 默认实施项目（若用户没另填项目名）
      customerName: string
      similarCustomers: string[]
      projectName?: string // 用户自定义的项目名（若有）
    }
  | { kind: "project"; projectName: string; customerId: string; customerName: string }
  | null

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

  const [directoryVersion, setDirectoryVersion] = useState(0)
  // 每次渲染读取（数据量小）：创建客户/项目后 bump directoryVersion 触发重渲染
  const customers = getCustomers()
  const projects = getProjects()
  void directoryVersion

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<(typeof INVITABLE_ROLES)[number]["value"] | "">("")
  const [customerId, setCustomerId] = useState("")
  const [customerText, setCustomerText] = useState("")
  const [projectId, setProjectId] = useState("")
  const [projectText, setProjectText] = useState("")
  const [error, setError] = useState<InviteFormError>(null)
  const [invalid, setInvalid] = useState<InvalidFields>({})
  const [submitting, setSubmitting] = useState(false)
  const [pendingCreation, setPendingCreation] = useState<PendingCreation>(null)
  const [lastLink, setLastLink] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[]>(() => getInvites())

  // Customer PM scope: locked to their own customer + project, no PM role and
  // no custom creation.
  const lockedCustomer = !isInternal ? actor.customerId ?? "" : ""
  const lockedProject = !isInternal ? (actor.projectIds?.[0] ?? "") : ""
  const effectiveCustomerId = isInternal ? customerId : lockedCustomer
  const effectiveProjectId = isInternal ? projectId : lockedProject

  // Project choices: internal users pick from the selected customer's
  // projects; a customer PM only sees the projects they are the PM of
  // (mock: actor.projectIds) — never their customer's other projects.
  const availableProjects = useMemo(
    () =>
      isInternal
        ? projects.filter((p) => p.customerId === effectiveCustomerId)
        : projects.filter((p) => (actor.projectIds ?? []).includes(p.id)),
    [projects, effectiveCustomerId, isInternal, actor.projectIds]
  )

  const invitableRoles = useMemo(
    () =>
      INVITABLE_ROLES.filter((r) => isInternal || r.value !== "customer-pm"),
    [isInternal]
  )

  const customerName = (id?: string) =>
    customers.find((c) => c.id === id)?.name ?? "—"
  const projectName = (id?: string) =>
    projects.find((p) => p.id === id)?.name ?? "—"

  // Resolve the customer/project the invite will target, queueing creation of
  // anything that doesn't exist yet. Returns null when a confirm dialog must
  // be shown first.
  function resolveTargets():
    | { customerId: string; projectId: string }
    | null {
    let cid = effectiveCustomerId
    let pid = effectiveProjectId

    if (isInternal) {
      // Customer: match existing by name, else queue creation.
      const customerQuery = customerText.trim()
      if (!cid && customerQuery) {
        const existing = findCustomerByName(customerQuery)
        if (existing) {
          cid = existing.id
        } else {
          const projectQuery = projectText.trim()
          setPendingCreation({
            kind: "customer",
            customerName: customerQuery,
            similarCustomers: findSimilarCustomers(customerQuery).map((c) => c.name),
            // 新客户默认项目为「{客户名} 实施项目」，除非用户另填了项目名
            projectName: projectQuery || undefined,
          })
          return null
        }
      }
      // Project: match existing under the selected customer, else queue.
      if (cid && !pid && projectText.trim()) {
        const existing = findProjectByName(cid, projectText.trim())
        if (existing) {
          pid = existing.id
        } else {
          setPendingCreation({
            kind: "project",
            projectName: projectText.trim(),
            customerId: cid,
            customerName: customerName(cid),
          })
          return null
        }
      }
    }

    if (!cid || !pid) return null
    return { customerId: cid, projectId: pid }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Per-field validation: mark only the fields that are missing or
    // malformed — fields the user already filled keep their normal look.
    const nextInvalid: InvalidFields = {}
    const emailTrimmed = email.trim()
    if (!emailTrimmed) {
      nextInvalid.email = true
    } else if (!EMAIL_RE.test(emailTrimmed)) {
      nextInvalid.email = true
    }
    if (!name.trim()) nextInvalid.name = true
    if (!role) nextInvalid.role = true
    if (isInternal && !customerText.trim()) nextInvalid.customer = true
    // Project is required — unless the customer itself is brand new: a new
    // customer automatically gets a default "{客户名} 实施项目", so the
    // project field can stay empty in that case.
    const customerIsNew =
      isInternal &&
      !customerId &&
      customerText.trim() !== "" &&
      !findCustomerByName(customerText.trim())
    if (isInternal && !customerIsNew && !projectText.trim()) {
      nextInvalid.project = true
    }

    setInvalid(nextInvalid)
    if (Object.keys(nextInvalid).length > 0) {
      // More precise message: malformed email vs missing fields.
      if (emailTrimmed && !EMAIL_RE.test(emailTrimmed)) {
        setError("invalid-email")
      } else {
        setError("required")
      }
      return
    }
    setError(null)
    const targets = resolveTargets()
    if (!targets) return // 等待确认弹窗
    sendInvite(targets.customerId, targets.projectId)
  }

  // Typing/selecting a field clears its invalid flag (red outline disappears
  // as soon as the field is fixed).
  function clearInvalid(field: keyof InvalidFields) {
    setInvalid((prev) => (prev[field] ? { ...prev, [field]: false } : prev))
  }

  // User confirmed the creation dialog: create what's missing, then invite.
  function handleConfirmCreation() {
    if (!pendingCreation) return
    let cid = effectiveCustomerId
    let pid = effectiveProjectId

    if (pendingCreation.kind === "customer") {
      const created = createCustomer(pendingCreation.customerName)
      if (created.ok) {
        cid = created.customer.id
        setCustomerId(cid)
        setCustomerText(created.customer.name)
        const projectResult = createProject(
          cid,
          pendingCreation.projectName ?? `${created.customer.name} 实施项目`
        )
        if (projectResult.ok) {
          pid = projectResult.project.id
          setProjectId(pid)
          setProjectText(projectResult.project.name)
        }
        setDirectoryVersion((v) => v + 1)
      }
    } else {
      const created = createProject(
        pendingCreation.customerId,
        pendingCreation.projectName
      )
      if (created.ok) {
        pid = created.project.id
        setProjectId(pid)
        setProjectText(created.project.name)
        setDirectoryVersion((v) => v + 1)
      }
    }

    setPendingCreation(null)
    if (cid && pid) sendInvite(cid, pid)
  }

  function sendInvite(customerId: string, projectId: string) {
    setSubmitting(true)
    // Small delay so the loading state is visible (mock auth is synchronous).
    window.setTimeout(() => {
      const result = createInvite({
        email,
        name,
        role: role as "customer-pm" | "key-user" | "regular",
        customerId,
        projectId,
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
        setCustomerText("")
        setProjectId("")
        setProjectText("")
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
              <Field data-invalid={invalid.email}>
                <FieldLabel htmlFor="inv-email">{t("inviteEmail")}</FieldLabel>
                <Input
                  id="inv-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearInvalid("email")
                  }}
                  aria-invalid={invalid.email}
                  placeholder={t("inviteEmailPlaceholder")}
                />
              </Field>
              <Field data-invalid={invalid.name}>
                <FieldLabel htmlFor="inv-name">{t("inviteName")}</FieldLabel>
                <Input
                  id="inv-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    clearInvalid("name")
                  }}
                  aria-invalid={invalid.name}
                  placeholder={t("inviteNamePlaceholder")}
                />
              </Field>
              <Field data-invalid={invalid.role}>
                <FieldLabel htmlFor="inv-role">{t("inviteRole")}</FieldLabel>
                <Select
                  value={role || null}
                  onValueChange={(v) => {
                    setRole((v ?? "") as typeof role)
                    clearInvalid("role")
                  }}
                >
                  <SelectTrigger id="inv-role" className="w-full">
                    {/* Format the selected value back to its display label —
                        base-ui SelectValue renders the raw value otherwise. */}
                    <SelectValue placeholder={t("inviteRolePlaceholder")}>
                      {(v: string | null) =>
                        v ? t(inviteRoleLabelKey(v as Invite["role"])) : null
                      }
                    </SelectValue>
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
                <Field data-invalid={invalid.customer}>
                  <FieldLabel htmlFor="inv-customer">{t("inviteCustomer")}</FieldLabel>
                  <CreatableCombobox
                    options={customers.map((c) => ({ value: c.id, label: c.name }))}
                    value={customerId}
                    onValueChange={(v) => {
                      setCustomerId(v)
                      clearInvalid("customer")
                      // 换客户后清空项目选择，防止项目与客户错配
                      if (v) {
                        setProjectId("")
                        setProjectText("")
                      }
                    }}
                    text={customerText}
                    onTextChange={(v) => {
                      setCustomerText(v)
                      clearInvalid("customer")
                    }}
                    placeholder={t("inviteCustomerPlaceholder")}
                    allowCreate
                    emptyText={t("comboboxEmpty")}
                    createLabel={(text) => t("comboboxCreate", { text })}
                    className="w-full"
                  />
                </Field>
              )}
              <Field data-invalid={invalid.project}>
                <FieldLabel htmlFor="inv-project">{t("inviteProject")}</FieldLabel>
                <CreatableCombobox
                  options={availableProjects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  value={effectiveProjectId}
                  onValueChange={(v) => {
                    setProjectId(v)
                    clearInvalid("project")
                  }}
                  text={isInternal ? projectText : projectName(lockedProject)}
                  onTextChange={(v) => {
                    if (isInternal) {
                      setProjectText(v)
                      clearInvalid("project")
                    }
                  }}
                  placeholder={t("inviteProjectPlaceholder")}
                  allowCreate={isInternal}
                  emptyText={t("comboboxEmpty")}
                  createLabel={(text) => t("comboboxCreate", { text })}
                  disabled={!isInternal}
                  className="w-full"
                />
              </Field>

              {error && (
                <Field data-invalid>
                  <FieldDescription className="text-destructive">
                    {error === "required" && t("errorRequired")}
                    {error === "invalid-email" && t("errorInvalidEmail")}
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
                  <TableHead>{t("colInviteCustomer")}</TableHead>
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
                      <TableCell>{customerName(invite.customerId)}</TableCell>
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
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      {t("emptyInvites")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 创建确认弹窗：客户/项目不存在时，确认后再创建并继续邀请 */}
      <Dialog
        open={pendingCreation !== null}
        onOpenChange={(open) => !open && setPendingCreation(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{t("confirmCreateTitle")}</DialogTitle>
          <DialogDescription>
            {pendingCreation?.kind === "customer" ? (
              <>
                {t("confirmCreateCustomer", {
                  name: pendingCreation.customerName,
                  project:
                    pendingCreation.projectName ??
                    `${pendingCreation.customerName} 实施项目`,
                })}
                {pendingCreation.similarCustomers.length > 0 && (
                  <p className="mt-2 text-destructive">
                    {t("similarCustomersHint", {
                      names: pendingCreation.similarCustomers.join("、"),
                    })}
                  </p>
                )}
              </>
            ) : (
              pendingCreation &&
              t("confirmCreateProject", {
                name: pendingCreation.projectName,
                customer: pendingCreation.customerName,
              })
            )}
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingCreation(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleConfirmCreation}>
              {t("confirmCreateButton")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
