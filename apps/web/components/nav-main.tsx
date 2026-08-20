"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronRightIcon, TerminalSquareIcon, BlocksIcon } from "lucide-react"

// Menu structure is built from the i18n dictionary — template-ready.
// Active state is derived from the current pathname (usePathname): the
// sub-item whose url matches the route is highlighted, and the top-level
// group lights up when any of its sub-items is active — zero config for new
// menu entries.
export function NavMain() {
  // Close the mobile sheet on navigation (client-side nav doesn't reload the
  // page, so the sheet would otherwise stay open).
  const { setOpenMobile } = useSidebar()
  const t = useTranslations("Nav")
  const pathname = usePathname()

  const items = [
    {
      title: t("prototype"),
      url: "#",
      icon: <TerminalSquareIcon />,
      items: [
        { title: t("dashboard"), url: "/" },
        { title: t("cards"), url: "/prototype/cards" },
      ],
    },
    {
      title: t("components"),
      url: "#",
      icon: <BlocksIcon />,
      items: [
        { title: t("imagePreview"), url: "/components/image-preview" },
        { title: t("pdfPreview"), url: "/components/pdf-preview" },
      ],
    },
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("platform")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const groupActive = item.items?.some(
            (subItem) => subItem.url !== "#" && pathname === subItem.url
          )
          return (
            <Collapsible
              key={item.title}
              defaultOpen
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={groupActive}
                  />
                }
              >
                {item.icon}
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        isActive={pathname === subItem.url}
                        render={
                          <Link
                            href={subItem.url}
                            onClick={() => setOpenMobile(false)}
                          />
                        }
                      >
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
