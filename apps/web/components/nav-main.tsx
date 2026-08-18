"use client"

import Link from "next/link"
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
import { ChevronRightIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon } from "lucide-react"

// Menu structure is built from the i18n dictionary — template-ready.
export function NavMain() {
  // Close the mobile sheet on navigation (client-side nav doesn't reload the
  // page, so the sheet would otherwise stay open).
  const { setOpenMobile } = useSidebar()
  const t = useTranslations("Nav")

  const items = [
    {
      title: t("prototype"),
      url: "#",
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [
        { title: t("dashboard"), url: "/" },
        { title: t("cards"), url: "/prototype/cards" },
      ],
    },
    {
      title: t("models"),
      url: "#",
      icon: <BotIcon />,
      items: [
        { title: t("genesis"), url: "#" },
        { title: t("explorer"), url: "#" },
        { title: t("quantum"), url: "#" },
      ],
    },
    {
      title: t("documentation"),
      url: "#",
      icon: <BookOpenIcon />,
      items: [
        { title: t("introduction"), url: "#" },
        { title: t("getStarted"), url: "#" },
        { title: t("tutorials"), url: "#" },
        { title: t("changelog"), url: "#" },
      ],
    },
    {
      title: t("settings"),
      url: "#",
      icon: <Settings2Icon />,
      items: [
        { title: t("general"), url: "#" },
        { title: t("team"), url: "#" },
        { title: t("billing"), url: "#" },
        { title: t("limits"), url: "#" },
      ],
    },
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("platform")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
            className="group/collapsible"
            render={<SidebarMenuItem />}
          >
            <CollapsibleTrigger
              render={<SidebarMenuButton tooltip={item.title} />}
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
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
