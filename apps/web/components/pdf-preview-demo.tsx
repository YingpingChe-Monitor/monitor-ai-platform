"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { useTranslations } from "next-intl"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { EmbedPdfViewer } from "@/components/pdf-viewer-embed"
import { PdfJsRawViewer } from "@/components/pdf-viewer-pdfjs"

// react-pdf touches browser-only globals (pdf.js), so it must skip SSR:
// dynamic import with ssr:false (official react-pdf Next.js pattern).
const ReactPdfViewer = dynamic(
  () => import("@/components/pdf-viewer-react-pdf").then((m) => m.ReactPdfViewer),
  { ssr: false }
)

type PreviewMode = "react-pdf" | "embed" | "pdfjs"

const MODE_KEYS: Record<PreviewMode, string> = {
  "react-pdf": "modeReactPdf",
  embed: "modeEmbed",
  pdfjs: "modePdfjs",
}

const DESCRIPTION_KEYS: Record<PreviewMode, string> = {
  "react-pdf": "reactPdfDescription",
  embed: "embedDescription",
  pdfjs: "pdfjsDescription",
}

const isMode = (v: string | undefined): v is PreviewMode =>
  v === "react-pdf" || v === "embed" || v === "pdfjs"

// Three PDF preview implementations, switchable via a segmented control in
// the card header (same pattern as ImagePreviewDemo / Total Visitors).
export function PdfPreviewDemo() {
  const t = useTranslations("PdfPreview")
  const [mode, setMode] = useState<PreviewMode>("react-pdf")

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t("modeLabel")}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {t(DESCRIPTION_KEYS[mode])}
          </span>
          <span className="@[540px]/card:hidden">{t(MODE_KEYS[mode])}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={[mode]}
            onValueChange={(value) => {
              if (isMode(value[0])) setMode(value[0])
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="react-pdf">{t("modeReactPdf")}</ToggleGroupItem>
            <ToggleGroupItem value="embed">{t("modeEmbed")}</ToggleGroupItem>
            <ToggleGroupItem value="pdfjs">{t("modePdfjs")}</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={mode}
            onValueChange={(value) => {
              if (value && isMode(value)) setMode(value)
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label={t("modeLabel")}
            >
              <SelectValue placeholder={t("modeReactPdf")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(["react-pdf", "embed", "pdfjs"] as PreviewMode[]).map((m) => (
                <SelectItem key={m} value={m} className="rounded-lg">
                  {t(MODE_KEYS[m])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {mode === "react-pdf" && <ReactPdfViewer fileUrl="/sample.pdf" />}
        {mode === "embed" && <EmbedPdfViewer fileUrl="/sample.pdf" />}
        {mode === "pdfjs" && <PdfJsRawViewer fileUrl="/sample.pdf" />}
      </CardContent>
    </Card>
  )
}
