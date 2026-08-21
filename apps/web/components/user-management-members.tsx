"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { BanIcon, CheckCircle2Icon, Loader2Icon, UserPlusIcon } from "lucide-react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
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
  createInternalUser,
  getCustomers,
  getProjects,
  setUserStatus,
  type InternalDepartment,
  type Session,
  type User,
} from "@/lib/auth"

// Role filter options: multi-select (empty = 全部角色), so no "all" entry.
const ROLE_OPTIONS: { value: User["role"]; labelKey: string }[] = [
  { value: "superadmin", labelKey: "roleSuperadmin" },
  { value: "internal", labelKey: "roleInternal" },
  { value: "customer-pm", labelKey: "roleCustomerPm" },
  { value: "key-user", labelKey: "roleKeyUser" },
  { value: "regular", labelKey: "roleRegular" },
]

const DEPARTMENT_OPTIONS: {
  value: InternalDepartment
  labelKey: string
}[] = [
  { value: "implementation", labelKey: "departmentImplementation" },
  { value: "development", labelKey: "departmentDevelopment" },
  { value: "after-sales", labelKey: "departmentAfterSales" },
]

type CreateFormError =
  | "required"
  | "too-short"
  | "username-taken"
  | "not-superadmin"
  | null

function CreateInternalUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const t = useTranslations("UserManagement")
  const [username, setUsername] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState<InternalDepartment | "">("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<CreateFormError>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !name.trim() || !email.trim() || !department || !password) {
      setError("required")
      return
    }
    if (password.length < 6) {
      setError("too-short")
      return
    }
    setError(null)
    setSubmitting(true)
    // Small delay so the loading state is visible (mock auth is synchronous).
    window.setTimeout(() => {
      const result = createInternalUser({
        username,
        name,
        email,
        department: department as InternalDepartment,
        password,
      })
      setSubmitting(false)
      if (!result.ok) {
        setError(
          result.error === "username-taken"
            ? "username-taken"
            : result.error === "invalid-role"
              ? "required"
              : "not-superadmin"
        )
        return
      }
      toast.success(t("toastUserCreated"))
      setUsername("")
      setName("")
      setEmail("")
      setDepartment("")
      setPassword("")
      onCreated()
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{t("createInternalTitle")}</DialogTitle>
        <DialogDescription>{t("createInternalDescription")}</DialogDescription>
        <form onSubmit={handleSubmit} noValidate className="mt-2">
          <FieldGroup>
            <Field data-invalid={error === "required"}>
              <FieldLabel htmlFor="ci-name">{t("fieldName")}</FieldLabel>
              <Input
                id="ci-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={error === "required"}
                placeholder={t("fieldNamePlaceholder")}
              />
            </Field>
            <Field data-invalid={error === "required" || error === "username-taken"}>
              <FieldLabel htmlFor="ci-username">{t("fieldUsername")}</FieldLabel>
              <Input
                id="ci-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={error === "required" || error === "username-taken"}
                placeholder={t("fieldUsernamePlaceholder")}
              />
            </Field>
            <Field data-invalid={error === "required"}>
              <FieldLabel htmlFor="ci-email">{t("fieldEmail")}</FieldLabel>
              <Input
                id="ci-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error === "required"}
                placeholder={t("fieldEmailPlaceholder")}
              />
            </Field>
            <Field data-invalid={error === "required"}>
              <FieldLabel htmlFor="ci-department">{t("fieldDepartment")}</FieldLabel>
              <Select
                value={department || null}
                onValueChange={(v) => setDepartment((v ?? "") as InternalDepartment | "")}
              >
                <SelectTrigger id="ci-department" className="w-full">
                  <SelectValue placeholder={t("fieldDepartmentPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={error === "required" || error === "too-short"}>
              <FieldLabel htmlFor="ci-password">{t("fieldPassword")}</FieldLabel>
              <Input
                id="ci-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error === "required" || error === "too-short"}
                placeholder={t("fieldPasswordPlaceholder")}
              />
            </Field>

            {error && (
              <Field data-invalid>
                <FieldDescription className="text-destructive">
                  {error === "required" && t("errorRequired")}
                  {error === "too-short" && t("errorTooShort")}
                  {error === "username-taken" && t("errorUsernameTaken")}
                  {error === "not-superadmin" && t("errorForbidden")}
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
                    {t("submit")}
                  </>
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UserManagementMembers({
  session,
  users,
  onRefresh,
}: {
  session: Session
  users: User[]
  onRefresh: () => void
}) {
  const t = useTranslations("UserManagement")
  const [search, setSearch] = useState("")
  // Multi-select filters: empty array = 全部 (no filter).
  const [roleFilter, setRoleFilter] = useState<User["role"][]>([])
  const [projectFilter, setProjectFilter] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)

  const customers = getCustomers()
  const projects = getProjects()
  const actor = session.user

  // Scope: superadmin / internal see everyone; a customer PM only sees the
  // members of their own project.
  const visibleUsers = useMemo(() => {
    const scoped = users.filter((u) => {
      if (actor.role === "customer-pm") {
        return (
          u.role !== "superadmin" &&
          u.role !== "internal" &&
          (u.projectIds ?? []).some((pid) => (actor.projectIds ?? []).includes(pid))
        )
      }
      return true
    })
    const query = search.trim().toLowerCase()
    return scoped.filter((u) => {
      if (roleFilter.length > 0 && !roleFilter.includes(u.role)) return false
      if (
        projectFilter.length > 0 &&
        !(u.projectIds ?? []).some((pid) => projectFilter.includes(pid))
      ) {
        return false
      }
      if (!query) return true
      return (
        u.name.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      )
    })
  }, [users, actor, search, roleFilter, projectFilter])

  const customerName = (id?: string) =>
    customers.find((c) => c.id === id)?.name ?? "—"
  const projectNames = (ids?: string[]) =>
    ids
      ?.map((pid) => projects.find((p) => p.id === pid)?.name)
      .filter(Boolean)
      .join(", ") ?? "—"

  // Can the current actor manage (deactivate/activate) this user?
  function canManage(target: User): boolean {
    if (target.username === actor.username) return false
    if (actor.role === "superadmin") return true
    if (actor.role === "internal") {
      return target.role !== "superadmin" && target.role !== "internal"
    }
    if (actor.role === "customer-pm") {
      return (
        (target.role === "key-user" || target.role === "regular") &&
        (target.projectIds ?? []).some((pid) => (actor.projectIds ?? []).includes(pid))
      )
    }
    return false
  }

  function handleToggleStatus(user: User) {
    const next = user.status === "inactive" ? "active" : "inactive"
    const result = setUserStatus(user.username, next)
    if (!result.ok) {
      toast.error(
        result.error === "self-disable" ? t("errorSelfDisable") : t("errorForbidden")
      )
      return
    }
    toast.success(t("toastStatusChanged"))
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full max-w-64"
        />
        <RoleFilterCombobox
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          t={t}
        />
        <ProjectFilterCombobox
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          projects={projects}
          t={t}
        />
        {actor.role === "superadmin" && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlusIcon data-icon="inline-start" />
            {t("createInternal")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("memberListTitle")}</CardTitle>
          <CardDescription>
            {t("memberListDescription", { count: visibleUsers.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colName")}</TableHead>
                  <TableHead>{t("colUsername")}</TableHead>
                  <TableHead>{t("colEmail")}</TableHead>
                  <TableHead>{t("colRole")}</TableHead>
                  <TableHead>{t("colCustomer")}</TableHead>
                  <TableHead>{t("colProject")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead className="text-right">{t("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user) => (
                  <TableRow key={user.username}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>
                        {user.role === "superadmin" && t("roleSuperadmin")}
                        {user.role === "internal" &&
                          (user.department
                            ? t(departmentLabelKey(user.department))
                            : t("roleInternal"))}
                        {user.role === "customer-pm" && t("roleCustomerPm")}
                        {user.role === "key-user" && t("roleKeyUser")}
                        {user.role === "regular" && t("roleRegular")}
                      </Badge>
                    </TableCell>
                    <TableCell>{customerName(user.customerId)}</TableCell>
                    <TableCell>{projectNames(user.projectIds)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active"
                            ? "secondary"
                            : user.status === "inactive"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {user.status === "active" && t("statusActive")}
                        {user.status === "inactive" && t("statusInactive")}
                        {user.status === "pending" && t("statusPending")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage(user) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status === "inactive" ? (
                            <>
                              <CheckCircle2Icon data-icon="inline-start" />
                              {t("enable")}
                            </>
                          ) : (
                            <>
                              <BanIcon data-icon="inline-start" />
                              {t("disable")}
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {visibleUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      {t("emptyMembers")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateInternalUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={onRefresh}
      />
    </div>
  )
}

// "after-sales" -> "departmentAfterSales" (kebab-case to the i18n key).
function departmentLabelKey(department: InternalDepartment) {
  return `department${department
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`
}

type FilterT = (key: string) => string

type FilterOption = { value: string; label: string }

// Multi-select role filter. `autoComplete="none"` keeps the list static: no
// typeahead filtering and no inline autocompletion — the six roles are simply
// picked from the dropdown (multi-select chips). Creation is not offered.
function RoleFilterCombobox({
  roleFilter,
  setRoleFilter,
  t,
}: {
  roleFilter: User["role"][]
  setRoleFilter: (next: User["role"][]) => void
  t: FilterT
}) {
  const anchorRef = useComboboxAnchor()
  const options: FilterOption[] = ROLE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }))
  const selected = options.filter((o) => roleFilter.includes(o.value as User["role"]))

  return (
    <Combobox
      items={options}
      multiple
      value={selected}
      onValueChange={(next) =>
        setRoleFilter((next ?? []).map((o) => o.value as User["role"]))
      }
      autoComplete="none"
      filter={null}
    >
      <ComboboxChips ref={anchorRef} className="w-36">
        <ComboboxValue>
          {(value: FilterOption[] | null) => (
            <React.Fragment>
              {(value ?? []).map((o) => (
                <ComboboxChip key={o.value}>{o.label}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={value && value.length > 0 ? "" : t("allRoles")}
                className="w-full min-w-0"
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>{t("comboboxEmpty")}</ComboboxEmpty>
        <ComboboxList>
          {(item: FilterOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

// Multi-select project filter. Typeahead filtering stays on (the default
// `autoComplete="list"`), so users can type to narrow the projects, but
// creation is not offered — this is a filter, not an invite form.
function ProjectFilterCombobox({
  projectFilter,
  setProjectFilter,
  projects,
  t,
}: {
  projectFilter: string[]
  setProjectFilter: (next: string[]) => void
  projects: { id: string; name: string }[]
  t: FilterT
}) {
  const anchorRef = useComboboxAnchor()
  const options: FilterOption[] = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }))
  const selected = options.filter((o) => projectFilter.includes(o.value))

  return (
    <Combobox
      items={options}
      multiple
      value={selected}
      onValueChange={(next) => setProjectFilter((next ?? []).map((o) => o.value))}
      autoComplete="list"
    >
      <ComboboxChips ref={anchorRef} className="w-44">
        <ComboboxValue>
          {(value: FilterOption[] | null) => (
            <React.Fragment>
              {(value ?? []).map((o) => (
                <ComboboxChip key={o.value}>{o.label}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={value && value.length > 0 ? "" : t("allProjects")}
                className="w-full min-w-0"
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>{t("comboboxEmpty")}</ComboboxEmpty>
        <ComboboxList>
          {(item: FilterOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
