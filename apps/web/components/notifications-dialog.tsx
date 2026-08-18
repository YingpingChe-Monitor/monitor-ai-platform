"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  EllipsisIcon,
  SearchIcon,
  InboxIcon,
  CheckIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type NotificationType = "info" | "success" | "warning" | "error"

type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  content: string
  time: string
}

const NOTIFICATION_IDS = [
  "maintenance",
  "passwordChanged",
  "diskSpace",
  "connectionLost",
  "release",
  "backup",
] as const

// Mock initial read state: these arrive already read, the rest unread.
const INITIAL_READ_IDS: readonly string[] = [
  "connectionLost",
  "release",
  "backup",
]

export { NOTIFICATION_IDS, INITIAL_READ_IDS }

const TYPE_KEYS: Record<NotificationType, string> = {
  info: "typeInfo",
  success: "typeSuccess",
  warning: "typeWarning",
  error: "typeError",
}

const TYPE_BADGE_VARIANTS: Record<NotificationType, "secondary" | "default" | "outline" | "destructive"> = {
  info: "secondary",
  success: "default",
  warning: "outline",
  error: "destructive",
}

// Which mock notification has which type (id -> type). Keys must match
// NOTIFICATION_IDS so the dictionary lookup below stays in sync.
const NOTIFICATION_TYPES: Record<(typeof NOTIFICATION_IDS)[number], NotificationType> = {
  maintenance: "warning",
  passwordChanged: "success",
  diskSpace: "error",
  connectionLost: "warning",
  release: "info",
  backup: "success",
}

// Notifications card opened from the user menu's "Notifications" item.
// Table layout mirrors the CardsPayments sample on /prototype/cards; a search
// box above the table filters rows by title/content (case-insensitive).
// Row text is derived from the i18n dictionary via useMemo so switching
// language re-renders the list. Read/deleted flags are owned by the PARENT
// (NavUser) so the unread-count badge on the menu item stays in sync.
export function NotificationsDialog({
  open,
  onOpenChange,
  readIds,
  deletedIds,
  onMarkRead,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  readIds: ReadonlySet<string>
  deletedIds: ReadonlySet<string>
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations("Notifications")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const items = useMemo<NotificationItem[]>(
    () =>
      NOTIFICATION_IDS.filter((id) => !deletedIds.has(id)).map((id) => ({
        id,
        type: NOTIFICATION_TYPES[id],
        title: t(`items.${id}.title`),
        content: t(`items.${id}.content`),
        time: t(`items.${id}.time`),
      })),
    [t, deletedIds]
  )

  // Case-insensitive fuzzy filter over title + content.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    )
  }, [items, query])

  const visibleIds = filtered.map((n) => n.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function remove(id: string) {
    onDelete(id)
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        {/* Visually hidden for a11y; the Card below provides the visible heading. */}
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <Card className="border-0 shadow-none ring-0">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-8"
                aria-label={t("searchPlaceholder")}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      data-name="select"
                      className="w-10 [&>[role=checkbox]]:translate-y-[2px] [&:has([role=checkbox])]:pl-3"
                    >
                      <Checkbox
                        aria-label="Select all"
                        checked={allVisibleSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead data-name="type" className="w-24">
                      {t("columnType")}
                    </TableHead>
                    <TableHead data-name="content">{t("columnContent")}</TableHead>
                    <TableHead data-name="time" className="w-28">
                      {t("columnTime")}
                    </TableHead>
                    <TableHead data-name="actions" className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        <InboxIcon className="mx-auto mb-1.5 size-6 opacity-60" />
                        {t("empty")}
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((notification) => {
                    const unread = !readIds.has(notification.id)
                    return (
                      <TableRow
                        key={notification.id}
                        data-unread={unread}
                      >
                        <TableCell
                          data-name="select"
                          className="[&>[role=checkbox]]:translate-y-[2px] [&:has([role=checkbox])]:pl-3"
                        >
                          <Checkbox
                            aria-label="Select row"
                            checked={selected.has(notification.id)}
                            onCheckedChange={() => toggleSelect(notification.id)}
                          />
                        </TableCell>
                        <TableCell data-name="type">
                          <Badge variant={TYPE_BADGE_VARIANTS[notification.type]}>
                            {t(TYPE_KEYS[notification.type])}
                          </Badge>
                        </TableCell>
                        <TableCell data-name="content">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={cn(
                                "text-sm leading-tight",
                                unread && "font-bold"
                              )}
                            >
                              {notification.title}
                              {unread && (
                                <span className="ml-2 align-middle text-[10px] font-medium text-primary uppercase">
                                  {t("unread")}
                                </span>
                              )}
                            </span>
                            <span
                              className={cn(
                                "text-muted-foreground truncate text-xs leading-tight",
                                unread && "font-semibold"
                              )}
                            >
                              {notification.content}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-name="time">
                          <div className="text-muted-foreground text-xs whitespace-nowrap">
                            {notification.time}
                          </div>
                        </TableCell>
                        <TableCell data-name="actions">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 p-0"
                                />
                              }
                            >
                              <EllipsisIcon />
                              <span className="sr-only">Open menu</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                disabled={!unread}
                                onClick={() => onMarkRead(notification.id)}
                              >
                                <CheckIcon
                                />
                                {t("markRead")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => remove(notification.id)}
                              >
                                <Trash2Icon
                                />
                                {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end gap-2">
              <div className="text-muted-foreground flex-1 text-sm">
                {t("selectedCount", { count: selected.size })}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
