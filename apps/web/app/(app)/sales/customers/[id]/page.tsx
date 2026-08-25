import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import customersData from "../data.json"
import type { CustomerRecord } from "@/components/customers-data"
import { CustomersDetail } from "@/components/customers-detail"

const customers = customersData as CustomerRecord[]

type Props = { params: Promise<{ id: string }> }

// Title stays generic: the client gates access and shows the customer name
// only to authorized viewers (mock auth lives in localStorage). The record
// itself is resolved client-side from the mock store (seed + overrides), so
// runtime-created customers keep working too.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Customers")
  return { title: t("title") }
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params

  return <CustomersDetail customers={customers} id={id} />
}
