"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { useTranslations } from "next-intl"
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Worker must be configured in the same module that renders <Document>/<Page>.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

// Plan 1: react-pdf@10 — Document + Page components with a toolbar (prev/next
// page, zoom) built from shadcn primitives.
export function ReactPdfViewer({ fileUrl }: { fileUrl: string }) {
  const t = useTranslations("PdfPreview")
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("prevPage")}
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("nextPage")}
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          >
            <ChevronRightIcon />
          </Button>
          <span className="ml-2 text-sm text-muted-foreground tabular-nums">
            {t("page", { current: pageNumber, total: numPages || "—" })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("zoomOut")}
            disabled={scale <= 0.5}
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))}
          >
            <ZoomOutIcon />
          </Button>
          <span className="w-10 text-center text-sm text-muted-foreground tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("zoomIn")}
            disabled={scale >= 2}
            onClick={() => setScale((s) => Math.min(2, +(s + 0.25).toFixed(2)))}
          >
            <ZoomInIcon />
          </Button>
        </div>
      </div>

      <div className="flex min-h-96 items-start justify-center rounded-lg border bg-muted/30 p-4">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n)
            setPageNumber(1)
          }}
          loading={
            <div className="flex flex-col items-center gap-2 py-16">
              <Skeleton className="h-4 w-32" />
              <span className="text-sm text-muted-foreground">{t("loading")}</span>
            </div>
          }
          error={
            <div className="py-16 text-sm text-destructive">{t("loadFailed")}</div>
          }
          className={cn("flex flex-col items-center")}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
            className="rounded-md shadow-md"
          />
        </Document>
      </div>
    </div>
  )
}
