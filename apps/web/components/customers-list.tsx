"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { PlusIcon } from "lucide-react"

import { getSession, type Session } from "@/lib/auth"
import { getCustomerAccess } from "@/lib/customer-access"
import { getAllCustomers } from "@/lib/customers-store"
import { PageContainer } from "@/components/page-container"
import {
  INDUSTRIES,
  INDUSTRY_LABELS,
  REGION_LABELS,
  SOURCE_LABELS,
  type CustomerRecord,
  type Industry,
} from "@/components/customers-data"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/** Customer directory: search + industry filter over the mock records. */
export function CustomersList({ customers }: { customers: CustomerRecord[] }) {
  const t = useTranslations("Customers")
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [allCustomers, setAllCustomers] = useState<CustomerRecord[]>([])
  const [query, setQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState<Industry | "all" | "">("")

  useEffect(() => {
    // Reading localStorage is an external-system check that can only run
    // client-side; flipping these flags here is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const s = getSession()
    setSession(s)
    setAllCustomers(getAllCustomers(customers))
    // Customers keep no directory: the three customer roles land directly on
    // their own customer's detail page when they open 客户 from the sidebar.
    const access = getCustomerAccess(s)
    const ownId = s?.user.customerId
    if (s && !access.canManageAll && ownId && customers.some((c) => c.id === ownId)) {
      router.replace(`/sales/customers/${ownId}`)
    }
  }, [customers, router])

  if (!session) return null
  const access = getCustomerAccess(session)

  const q = query.trim().toLowerCase()
  const industry = industryFilter === "all" ? "" : industryFilter
  const filtered = allCustomers.filter((c) => {
    if (!access.canView(c.id)) return false
    if (industry && c.industry !== industry) return false
    if (!q) return true
    return [c.name, c.contact, c.phone, c.email].some((v) =>
      v.toLowerCase().includes(q)
    )
  })

  return (
    <PageContainer>
      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl">{t("listTitle")}</CardTitle>
            <CardDescription>
              {access.canManageAll ? t("description") : t("readOnlyHint")}
            </CardDescription>
          </div>
          {access.canManageAll && (
            <Button nativeButton={false} render={<Link href="/sales/customers/new" />}>
              <PlusIcon data-icon="inline-start" />
              {t("createNew")}
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-56"
            />
            <Select
              value={industryFilter || null}
              onValueChange={(v) => setIndustryFilter(v === "all" ? "all" : (v ?? ""))}
            >
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder={t("industryFilterPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allIndustries")}</SelectItem>
                {INDUSTRIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(INDUSTRY_LABELS[item])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("contact")}</TableHead>
                  <TableHead>{t("phone")}</TableHead>
                  <TableHead>{t("industry")}</TableHead>
                  <TableHead>{t("region")}</TableHead>
                  <TableHead>{t("source")}</TableHead>
                  <TableHead>{t("overviewCreatedAt")}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="text-muted-foreground text-center text-sm">
                        {allCustomers.length === 0 ? t("emptyList") : t("noMatches")}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      data-state=""
                      onClick={() => router.push(`/sales/customers/${c.id}`)}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.contact || t("empty")}</TableCell>
                      <TableCell>{c.phone || t("empty")}</TableCell>
                      <TableCell>
                        {c.industry ? t(INDUSTRY_LABELS[c.industry]) : t("empty")}
                      </TableCell>
                      <TableCell>
                        {c.region ? t(REGION_LABELS[c.region]) : t("empty")}
                      </TableCell>
                      <TableCell>
                        {c.source ? t(SOURCE_LABELS[c.source]) : t("empty")}
                      </TableCell>
                      <TableCell>{c.createdAt}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/sales/customers/${c.id}`)
                          }}
                        >
                          {t("viewDetail")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
