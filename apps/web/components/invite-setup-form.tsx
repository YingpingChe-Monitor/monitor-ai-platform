"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { activateInvite } from "@/lib/auth"

type FormError =
  | "required"
  | "too-short"
  | "mismatch"
  | "not-found"
  | "used"
  | "expired"
  | "revoked"
  | null

// Landing page for one-time invite links (story 6): validate the token, let
// the invitee set a first password, activate the account, then send them to
// the login page. The link is single-use — after activation it dies.
export function InviteSetupForm() {
  const t = useTranslations("Invite")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<FormError>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || !confirmPassword) {
      setError("required")
      return
    }
    if (password.length < 6) {
      setError("too-short")
      return
    }
    if (password !== confirmPassword) {
      setError("mismatch")
      return
    }
    setError(null)
    setSubmitting(true)
    // Small delay so the loading state is visible (mock auth is synchronous).
    window.setTimeout(() => {
      const result = activateInvite(token, password)
      setSubmitting(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(t("success"))
      router.replace("/login")
    }, 500)
  }

  return (
    <Card className="w-full max-w-sm shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={error === "too-short" || error === "mismatch"}>
              <FieldLabel htmlFor="invite-password">{t("newPassword")}</FieldLabel>
              <Input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                placeholder={t("newPasswordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error === "too-short" || error === "mismatch"}
                autoFocus
              />
            </Field>
            <Field data-invalid={error === "mismatch"}>
              <FieldLabel htmlFor="invite-confirm">{t("confirmPassword")}</FieldLabel>
              <Input
                id="invite-confirm"
                type="password"
                autoComplete="new-password"
                placeholder={t("confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={error === "mismatch"}
              />
            </Field>

            {error && (
              <Field data-invalid>
                <FieldDescription className="text-destructive">
                  {error === "required" && t("errorRequired")}
                  {error === "too-short" && t("errorTooShort")}
                  {error === "mismatch" && t("errorMismatch")}
                  {error === "not-found" && t("errorNotFound")}
                  {error === "used" && t("errorUsed")}
                  {error === "expired" && t("errorExpired")}
                  {error === "revoked" && t("errorRevoked")}
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
                    {t("submit")}
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
