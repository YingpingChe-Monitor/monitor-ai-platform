import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import customersData from "./data.json"
import type { CustomerRecord } from "@/components/customers-data"
import { CustomersList } from "@/components/customers-list"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Customers")
  return { title: t("title") }
}

export default async function CustomersPage() {
  const t = await getTranslations("Customers")
  const customers = customersData as CustomerRecord[]

  return (
    <>
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
      </div>
      <CustomersList customers={customers} />
    </>
  )
}
