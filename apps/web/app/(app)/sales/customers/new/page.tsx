import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import customersData from "../data.json"
import type { CustomerRecord } from "@/components/customers-data"
import { CustomersForm } from "@/components/customers-form"

const customers = customersData as CustomerRecord[]

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Customers")
  return { title: t("createNew") }
}

export default function NewCustomerPage() {
  return <CustomersForm customers={customers} />
}
