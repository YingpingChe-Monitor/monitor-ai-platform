"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { KeyRoundIcon, Loader2Icon } from "lucide-react"

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
import { resetPassword, type Session, type User } from "@/lib/auth"

type SecurityFormError = "required" | "too-short" | "user-not-found" | "not-superadmin" | null

// 「安全」页签 — superadmin only (decision 2026-08, replaces self-service
// reset #39): pick any user, set a brand-new password that takes effect
// immediately; the old password dies. The superadmin relays the new password.
export function UserManagementSecurity({
  session,
  users,
}: {
  session: Session
  users: User[]
}) {
  const t = useTranslations("UserManagement")
  const [username, setUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<SecurityFormError>(null)
  const [submitting, setSubmitting] = useState(false)

  // Superadmin may reset any user — internal and customer alike.
  const candidates = useMemo(
    () => users.filter((u) => u.username !== session.user.username),
    [users, session.user.username]
  )

  const selected = candidates.find((u) => u.username === username)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !newPassword) {
      setError("required")
      return
    }
    if (newPassword.length < 6) {
      setError("too-short")
      return
    }
    setError(null)
    setSubmitting(true)
    // Small delay so the loading state is visible (mock auth is synchronous).
    window.setTimeout(() => {
      const result = resetPassword(username, newPassword)
      setSubmitting(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(t("toastPasswordReset"))
      setNewPassword("")
    }, 500)
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t("securityTitle")}</CardTitle>
        <CardDescription>{t("securityDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={error === "required" || error === "user-not-found"}>
              <FieldLabel htmlFor="sec-user">{t("selectUser")}</FieldLabel>
              <Select value={username || null} onValueChange={(v) => setUsername(v ?? "")}>
                <SelectTrigger id="sec-user" className="w-full">
                  <SelectValue placeholder={t("selectUserPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((u) => (
                    <SelectItem key={u.username} value={u.username}>
                      {u.name}（{u.username} — {u.email}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={error === "too-short" || error === "required"}>
              <FieldLabel htmlFor="sec-password">{t("newPassword")}</FieldLabel>
              <Input
                id="sec-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                aria-invalid={error === "too-short" || error === "required"}
                placeholder={t("newPasswordPlaceholder")}
              />
            </Field>

            {selected && (
              <Field>
                <FieldDescription>
                  {t("resetTarget", { name: selected.name, username: selected.username })}
                </FieldDescription>
              </Field>
            )}

            {error && (
              <Field data-invalid>
                <FieldDescription className="text-destructive">
                  {error === "required" && t("errorRequired")}
                  {error === "too-short" && t("errorTooShort")}
                  {error === "user-not-found" && t("errorUserNotFound")}
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
                    <KeyRoundIcon data-icon="inline-start" />
                    {t("resetSubmit")}
                  </>
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
