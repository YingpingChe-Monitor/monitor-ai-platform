"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Sidebar brand header — validated design (prototype verdict):
// - bar look: border-b border-sidebar-border
// - h-14 header, matched h-14 page bar in app-shell
// - horizontal logo lockup (logo.png, includes the wordmark) links to "/"
// - toggle inside the header (PanelLeftCloseIcon); collapsed: circular mark
//   (logo-sm.png) swaps to PanelLeftOpenIcon on hover. No badge, no team switcher.

export function BrandHeader() {
  const { state, isMobile, toggleSidebar, setOpenMobile } = useSidebar()
  const t = useTranslations("Brand")
  // On mobile the sidebar is a full-width sheet; the desktop collapsed state
  // doesn't apply there, so always show the expanded header (its toggle closes
  // the sheet, per design decision Q4).
  const collapsed = state === "collapsed" && !isMobile

  if (collapsed) {
    return (
      <SidebarHeader className="flex items-center border-b border-sidebar-border">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={t("expandSidebar")}
                onClick={toggleSidebar}
                className="group relative flex size-8 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              />
            }
          >
            {/* Circular mark only — the horizontal lockup doesn't fit the
                collapsed 40px rail. */}
            <img
              src="/logo-sm.png"
              alt={t("name")}
              className="size-6 transition-opacity duration-200 group-hover:opacity-0"
            />
            <PanelLeftOpenIcon className="absolute size-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </TooltipTrigger>
          <TooltipContent side="right">{t("expandSidebar")}</TooltipContent>
        </Tooltip>
      </SidebarHeader>
    )
  }

  return (
    <SidebarHeader className="flex h-14 flex-row items-center gap-2 border-b border-sidebar-border">
      <Link
        href="/"
        aria-label={`${t("name")} — ${t("goToDashboard")}`}
        onClick={() => setOpenMobile(false)}
        className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        {/* Horizontal logo lockup (contains the wordmark), 1.2× of the
            original h-6 (24px → 28.8px). */}
        <img
          src="/logo.png"
          alt=""
          className="h-[1.8rem] w-auto max-w-48 shrink-0 object-contain"
          width={256}
          height={74}
        />
      </Link>
      <div className="ml-auto">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("collapseSidebar")}
                onClick={toggleSidebar}
              />
            }
          >
            <PanelLeftCloseIcon />
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("collapseSidebar")}</TooltipContent>
        </Tooltip>
      </div>
    </SidebarHeader>
  )
}
