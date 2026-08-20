import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PdfPreviewDemo } from "@/components/pdf-preview-demo"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PdfPreview")
  return { title: t("title") }
}

export default async function PdfPreviewPage() {
  const t = await getTranslations("PdfPreview")

  return (
    <>
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <PdfPreviewDemo />
      </div>
    </>
  )
}
