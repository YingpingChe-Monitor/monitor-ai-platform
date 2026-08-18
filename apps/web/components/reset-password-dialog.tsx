"use client"

import { useState } from "react"
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
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { changePassword } from "@/lib/auth"

type FormError =
  | "required"
  | "too-short"
  | "mismatch"
  | "wrong-current"
  | null

// Reset-password card, opened from the user menu's "Account" item. Card
// layout mirrors the CardsCreateAccount sample on /prototype/cards
// (CardHeader + CardTitle/CardDescription + FieldGroup form).
export function ResetPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("Account")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<FormError>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("required")
      return
    }
    if (newPassword.length < 6) {
      setError("too-short")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("mismatch")
      return
    }
    setError(null)
    setSubmitting(true)
    // Small delay so the loading state is visible (mock auth is synchronous).
    window.setTimeout(() => {
      const result = changePassword(currentPassword, newPassword)
      setSubmitting(false)
      if (!result.ok) {
        setError(
          result.error === "wrong-current-password" ? "wrong-current" : "required"
        )
        return
      }
      toast.success(t("success"))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-sm">
        {/* Visually hidden for a11y; the Card below provides the visible heading. */}
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <Card className="border-0 shadow-none ring-0">
          <CardHeader>
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup>
                <Field
                  data-invalid={error === "required" || error === "wrong-current"}
                >
                  <FieldLabel htmlFor="current-password">
                    {t("currentPassword")}
                  </FieldLabel>
                  <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t("currentPasswordPlaceholder")}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    aria-invalid={error === "required" || error === "wrong-current"}
                  />
                </Field>
                <Field data-invalid={error === "too-short" || error === "mismatch"}>
                  <FieldLabel htmlFor="new-password">
                    {t("newPassword")}
                  </FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("newPasswordPlaceholder")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    aria-invalid={error === "too-short" || error === "mismatch"}
                  />
                </Field>
                <Field data-invalid={error === "mismatch"}>
                  <FieldLabel htmlFor="confirm-password">
                    {t("confirmPassword")}
                  </FieldLabel>
                  <Input
                    id="confirm-password"
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
                      {error === "wrong-current" && t("errorWrongCurrent")}
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
      </DialogContent>
    </Dialog>
  )
}
