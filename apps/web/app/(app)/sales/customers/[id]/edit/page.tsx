import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import customersData from "../../data.json"
import type { CustomerRecord } from "@/components/customers-data"
import { CustomersForm } from "@/components/customers-form"

const customers = customersData as CustomerRecord[]

type Props = { params: Promise<{ id: string }> }

// Title stays generic: the client gates access and shows the customer name
// only to authorized editors (mock auth lives in localStorage). The record
// is resolved client-side from the mock store (seed + overrides).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Customers")
  return { title: t("editTitle") }
}

export default async function EditCustomerPage({ params }: Props) {
  const { id } = await params

  return <CustomersForm customers={customers} id={id} />
}
