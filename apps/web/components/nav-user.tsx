"use client"

import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  ChevronsUpDownIcon,
  SparklesIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
  LanguagesIcon,
  CheckIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { logout, getSession } from "@/lib/auth"
import { setLocaleCookie, type LocaleCode } from "@/app/actions/locale"
import { useHoverCardOpen } from "@/hooks/use-hover-card-open"

const LOCALES: { code: LocaleCode; label: string }[] = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
]

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const { open, openCard, keepOpen, scheduleClose, closeCard } =
    useHoverCardOpen()

  const session = getSession()
  const user = session?.user ?? {
    username: "guest",
    name: "Guest",
    email: "",
    avatar: "",
  }
  const name = user.name === "管理员" && locale === "en" ? "Admin" : user.name
  const avatarSrc = user.avatar ?? ""

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={avatarSrc} alt={user.name} />
              <AvatarFallback>G5</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={avatarSrc} alt={user.name} />
                    <AvatarFallback>G5</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparklesIcon
                />
                {t("User.upgradeToPro")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheckIcon
                />
                {t("User.account")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon
                />
                {t("Nav.billing")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon
                />
                {t("User.notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {/* Language switcher as a hover popover (Q13): hover "语言" to pop
                the card with 中文 / English; click to switch instantly.
                Popover + useHoverCardOpen (see language-switcher.tsx for why
                HoverCard is avoided): no built-in hover detection, so the
                pointer can always reach the card (1000ms grace delay). */}
            <Popover
              open={open}
              onOpenChange={(next) => !next && closeCard()}
            >
              <PopoverTrigger
                nativeButton={false}
                onMouseEnter={openCard}
                onMouseLeave={scheduleClose}
                render={<DropdownMenuItem />}
              >
                <LanguagesIcon
                />
                <span>{t("User.language")}</span>
                <ChevronsUpDownIcon className="ml-auto size-3.5 opacity-60" />
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="start"
                sideOffset={8}
                className="w-40 p-1"
                onMouseEnter={keepOpen}
                onMouseLeave={closeCard}
              >
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

            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOutIcon
              />
              {t("User.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
