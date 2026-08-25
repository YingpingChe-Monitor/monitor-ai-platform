"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ArrowLeftIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { getSession, type Session } from "@/lib/auth"
import { getCustomerAccess } from "@/lib/customer-access"
import { deleteCustomer, getAllCustomers } from "@/lib/customers-store"
import { PageContainer, PageGrid } from "@/components/page-container"
import {
  INDUSTRY_LABELS,
  REGION_LABELS,
  SOURCE_LABELS,
  type CustomerRecord,
} from "@/components/customers-data"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Full-page customer detail: info card (main) + overview card (aside).
 * Access: superadmin / internal see & edit all; others see their own customer
 * read-only and get a denied card for anything else (never the record data).
 * The record is resolved from the mock store (seed + localStorage overrides)
 * so created/edited customers render current values.
 */
export function CustomersDetail({
  customers,
  id,
}: {
  customers: CustomerRecord[]
  id: string
}) {
  const t = useTranslations("Customers")
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [record, setRecord] = useState<CustomerRecord | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(getSession())
    setRecord(getAllCustomers(customers).find((c) => c.id === id) ?? null)
  }, [customers, id])

  if (!session) return null

  if (!record) {
    return (
      <PageContainer>
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{t("notFoundTitle")}</CardTitle>
            <CardDescription>{t("notFoundDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} variant="outline" render={<Link href="/sales/customers" />}>
              <ArrowLeftIcon data-icon="inline-start" />
              {t("backToList")}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const access = getCustomerAccess(session)

  if (!access.canView(record.id)) {
    const ownId = session.user.customerId
    return (
      <PageContainer>
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{t("noPermissionTitle")}</CardTitle>
            <CardDescription>{t("noPermissionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={ownId ? `/sales/customers/${ownId}` : "/sales/customers"} />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              {t("backToMyCustomer")}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  function handleDelete() {
    if (!record) return
    const result = deleteCustomer(record.id)
    if (!result.ok) {
      setDeleteError(true)
      return
    }
    toast.success(t("deleteSuccess"))
    setDeleteOpen(false)
    router.push("/sales/customers")
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{record.name}</h1>
        <p className="text-muted-foreground text-sm">
          {t("overviewId")}：{record.id} · {t("overviewCreatedAt")}：{record.createdAt}
        </p>
      </div>
      <PageGrid>
        <Card className="@container/card">
          <CardHeader className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">{t("detailTitle")}</CardTitle>
              <CardDescription>
                {access.canManageAll ? t("detailDescription") : t("readOnlyHint")}
              </CardDescription>
            </div>
            {/* Customers reach their own detail directly — no list to go
                back to, so action buttons only exist for managers. */}
            {access.canManageAll && (
              <div className="flex flex-wrap gap-2">
                <Button nativeButton={false} variant="outline" render={<Link href="/sales/customers" />}>
                  <ArrowLeftIcon data-icon="inline-start" />
                  {t("backToList")}
                </Button>
                <Button nativeButton={false} variant="outline" render={<Link href="/sales/customers/new" />}>
                  <PlusIcon data-icon="inline-start" />
                  {t("createNew")}
                </Button>
                <Button nativeButton={false} render={<Link href={`/sales/customers/${record.id}/edit`} />}>
                  <PencilIcon data-icon="inline-start" />
                  {t("edit")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteError(false)
                    setDeleteOpen(true)
                  }}
                >
                  <Trash2Icon data-icon="inline-start" />
                  {t("delete")}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Two-column info grid on wide cards so the detail reads as
                loaded content instead of a sparse full-width list. */}
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 @2xl/card:grid-cols-2">
              <InfoRow label={t("name")} value={record.name} />
              <InfoRow label={t("contact")} value={record.contact || t("empty")} />
              <InfoRow label={t("phone")} value={record.phone || t("empty")} />
              <InfoRow label={t("email")} value={record.email || t("empty")} />
              <InfoRow
                label={t("industry")}
                value={record.industry ? t(INDUSTRY_LABELS[record.industry]) : t("empty")}
              />
              <InfoRow
                label={t("region")}
                value={record.region ? t(REGION_LABELS[record.region]) : t("empty")}
              />
              <InfoRow
                label={t("source")}
                value={record.source ? t(SOURCE_LABELS[record.source]) : t("empty")}
              />
              <InfoRow label={t("address")} value={record.address || t("empty")} />
            </dl>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">{t("overviewTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3">
              <InfoRow label={t("overviewId")} value={record.id} />
              <InfoRow label={t("overviewCreatedAt")} value={record.createdAt} />
            </dl>
          </CardContent>
        </Card>
      </PageGrid>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <DialogDescription>
              {t("deleteConfirmName", { name: record.name })}
            </DialogDescription>
            <DialogDescription>
              {deleteError ? (
                <span className="text-destructive">{t("deleteBlocked")}</span>
              ) : (
                t("deleteConfirmDesc")
              )}
            </DialogDescription>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2Icon data-icon="inline-start" />
              {t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-medium break-all text-sm">{value}</dd>
    </div>
  )
}
