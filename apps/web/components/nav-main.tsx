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
import { ChevronRightIcon, TerminalSquareIcon } from "lucide-react"

// Menu structure is built from the i18n dictionary — template-ready.
// Only the Prototype group is shown: the other shadcn sample groups
// (Models, Documentation, Settings) have no real pages yet and were removed;
// projects list was removed too. Add entries back via the dictionary + nav-main.
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
