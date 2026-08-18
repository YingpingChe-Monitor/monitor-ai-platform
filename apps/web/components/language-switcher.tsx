"use client"

import { useLocale } from "next-intl"
import { LanguagesIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { setLocaleCookie, type LocaleCode } from "@/app/actions/locale"
import { useHoverCardOpen } from "@/hooks/use-hover-card-open"

const LOCALES: { code: LocaleCode; label: string }[] = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
]

// Language switcher as a hover popover (Q13): hovering the trigger pops a
// small card with 中文 / English; clicking one switches immediately. Works
// both on the login page (top-right) and inside the NavUser menu.
//
// Popover is used instead of HoverCard because Base UI's PreviewCard hover
// tracking (safePolygon) fails inside nested portals and closes the card
// before the pointer can reach it. Popover has no built-in hover logic, so
// open/close is fully controlled via useHoverCardOpen (open on trigger
// hover; close only after the pointer leaves both trigger and card, with a
// 1000ms grace delay for the move between them).
export function LanguageSwitcher() {
  const locale = useLocale()
  const { open, openCard, keepOpen, scheduleClose, closeCard } =
    useHoverCardOpen()

  return (
    <Popover open={open} onOpenChange={(next) => !next && closeCard()}>
      <PopoverTrigger
        onMouseEnter={openCard}
        onMouseLeave={scheduleClose}
        render={
          <Button variant="ghost" size="icon" aria-label="Language" />
        }
      >
        <LanguagesIcon />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-40 p-1"
        onMouseEnter={keepOpen}
        onMouseLeave={closeCard}
      >
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {locale === "zh" ? "选择语言" : "Choose language"}
        </p>
        {LOCALES.map((option) => (
          <button
            key={option.code}
            type="button"
            onClick={() => setLocaleCookie(option.code)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span>{option.label}</span>
            {locale === option.code && <CheckIcon className="size-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
