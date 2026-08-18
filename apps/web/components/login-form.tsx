"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { LogInIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { login } from "@/lib/auth"

type FormError = "user-not-found" | "wrong-password" | "required" | null

export function LoginForm() {
  const t = useTranslations("Login")
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<FormError>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError("required")
      return
    }
    setError(null)
    setSubmitting(true)
    // Small delay so the loading state is actually visible (mock auth is
    // synchronous) — keeps the interaction feeling real in the prototype.
    window.setTimeout(() => {
      const result = login(username, password)
      setSubmitting(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(t("success"))
      router.replace("/")
    }, 500)
  }

  return (
    <Card className="w-full max-w-sm shadow-md">
      <CardHeader className="text-center">
        {/* Monitor G5 logo — 256×74 horizontal, transparent background,
            shown at its natural size. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Monitor G5"
          className="mx-auto h-auto w-auto max-w-full"
          width={256}
          height={74}
        />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={error === "required" || error === "user-not-found"}>
              <FieldLabel htmlFor="username">{t("usernameLabel")}</FieldLabel>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                placeholder={t("usernamePlaceholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={error === "required" || error === "user-not-found"}
                autoFocus
              />
            </Field>
            <Field data-invalid={error === "required" || error === "wrong-password"}>
              <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error === "required" || error === "wrong-password"}
              />
            </Field>

            {error && (
              <Field data-invalid>
                <FieldDescription className="text-destructive">
                  {error === "user-not-found" && t("errorUserNotFound")}
                  {error === "wrong-password" && t("errorWrongPassword")}
                  {error === "required" && t("errorRequired")}
                </FieldDescription>
              </Field>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2Icon data-icon="inline-start" className="animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  <LogInIcon data-icon="inline-start" />
                  {t("submit")}
                </>
              )}
            </Button>
          </FieldGroup>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("demoHint")}
        </p>
      </CardContent>
    </Card>
  )
}
