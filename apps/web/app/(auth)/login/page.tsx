import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { GuestOnlyGuard } from "@/hooks/use-auth-guard"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Login")
  return { title: t("title") }
}

export default async function LoginPage() {
  const t = await getTranslations("Login")
  return (
    <GuestOnlyGuard>
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        {/* Theme + language controls, top-right */}
        <div className="absolute right-4 top-4 flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("footer")}
        </p>
      </div>
    </GuestOnlyGuard>
  )
}
