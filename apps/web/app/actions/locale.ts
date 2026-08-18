"use server"

import { cookies } from "next/headers"

export type LocaleCode = "zh" | "en"

// Client-side language switch: writing the cookie here (server action) makes
// next-intl's i18n/request.ts pick it up on the next RSC render, which the
// action's automatic router refresh triggers. Matches next-intl's official
// "without i18n routing" example.
export async function setLocaleCookie(locale: LocaleCode) {
  const store = await cookies()
  store.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
}
