"use client"

import { useEffect, useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { useTranslations } from "next-intl"
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

// Worker for raw pdf.js rendering (same pinned pdfjs-dist 5.4.296 that
// react-pdf depends on).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

// Plan 3: pdfjs-dist raw — render pages directly to a canvas with a minimal
// paging/zoom toolbar. Demonstrates the underlying engine with full control.
export function PdfJsRawViewer({ fileUrl }: { fileUrl: string }) {
  const t = useTranslations("PdfPreview")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [failed, setFailed] = useState(false)
  // Doc is STATE (not a ref) so that loading it triggers the render effect:
  // with a ref, setPageNumber(1) when pageNumber is already 1 is a React
  // bail-out and the canvas never renders until some other state changes.
  const [doc, setDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)

  // Load the document once.
  useEffect(() => {
    let cancelled = false
    setFailed(false)
    setDoc(null)
    pdfjsLib
      .getDocument(fileUrl)
      .promise.then((loaded) => {
        if (cancelled) return
        setDoc(loaded)
        setNumPages(loaded.numPages)
        setPageNumber(1)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [fileUrl])

  // Render the current page whenever doc/page/scale changes.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!doc || !canvas) return
    let cancelled = false

    doc.getPage(pageNumber).then((page) => {
      if (cancelled) return
      const viewport = page.getViewport({ scale })
      canvas.width = viewport.width
      canvas.height = viewport.height
      // pdfjs-dist 5.x: pass the canvas element (canvasContext is deprecated).
      page.render({ canvas, viewport }).promise.catch(() => {
        if (!cancelled) setFailed(true)
      })
    })
    return () => {
      cancelled = true
    }
  }, [doc, pageNumber, scale])

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

      <div className="flex min-h-96 items-start justify-center overflow-auto rounded-lg border bg-muted/30 p-4">
        {failed ? (
          <div className="py-16 text-sm text-destructive">{t("loadFailed")}</div>
        ) : (
          <canvas ref={canvasRef} className="rounded-md shadow-md" />
        )}
      </div>
    </div>
  )
}
