import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { CustomersForm } from "@/components/customers-form"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Customers")
  return { title: t("createNew") }
}

export default function NewCustomerPage() {
  return <CustomersForm />
}
