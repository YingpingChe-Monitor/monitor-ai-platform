"use client"

import { useTranslations } from "next-intl"

// Plan 2: iframe embed — the browser's native PDF viewer, zero dependencies.
// Known limitation: iOS Safari renders only the first page (research note
// SO 75511392).
export function EmbedPdfViewer({ fileUrl }: { fileUrl: string }) {
  const t = useTranslations("PdfPreview")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-96 flex-col overflow-hidden rounded-lg border bg-muted/30">
        <iframe
          src={fileUrl}
          title={t("title")}
          className="min-h-96 w-full flex-1 border-0"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        {t("embedDescription")}
      </p>
    </div>
  )
}
