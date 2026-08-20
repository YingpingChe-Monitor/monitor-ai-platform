"use client"

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
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox"
import GalleryBlock from "@/components/blocks/gallery-1"
import { CambioImage } from "@/components/ui/cambio-image"
import { ImageZoom } from "@/components/kibo-ui/image-zoom"

// Demo images from loremflickr (stable latency from CN, measured 2026-08).
// Remote images are best-effort: the lightbox falls back to a gradient block
// when a request fails, so the page never breaks.
const IMAGES: LightboxImage[] = [
  {
    id: "tech-1",
    src: "https://loremflickr.com/800/600/technology?lock=1",
    alt: "Technology",
    caption: "Technology",
    location: "loremflickr · 800×600",
  },
  {
    id: "nature-1",
    src: "https://loremflickr.com/800/600/nature?lock=2",
    alt: "Nature",
    caption: "Nature",
    location: "loremflickr · 800×600",
  },
  {
    id: "city-1",
    src: "https://loremflickr.com/800/600/city?lock=3",
    alt: "City",
    caption: "City",
    location: "loremflickr · 800×600",
  },
  {
    id: "industry-1",
    src: "https://loremflickr.com/800/600/industry?lock=4",
    alt: "Industry",
    caption: "Industry",
    location: "loremflickr · 800×600",
  },
  {
    id: "transport-1",
    src: "https://loremflickr.com/800/600/transport?lock=5",
    alt: "Transport",
    caption: "Transport",
    location: "loremflickr · 800×600",
  },
  {
    id: "abstract-1",
    src: "https://loremflickr.com/800/600/abstract?lock=6",
    alt: "Abstract",
    caption: "Abstract",
    location: "loremflickr · 800×600",
  },
]

type PreviewMode = "dialog" | "7ovr" | "cambio" | "zoom"

const MODE_KEYS: Record<PreviewMode, string> = {
  dialog: "modeDialog",
  "7ovr": "mode7ovr",
  cambio: "modeCambio",
  zoom: "modeZoom",
}

const DESCRIPTION_KEYS: Record<PreviewMode, string> = {
  dialog: "dialogDescription",
  "7ovr": "galleryDescription",
  cambio: "cambioDescription",
  zoom: "zoomDescription",
}

const isMode = (v: string | undefined): v is PreviewMode =>
  v === "dialog" || v === "7ovr" || v === "cambio" || v === "zoom"

// Four image-preview implementations, switchable via a segmented control in
// the card header — same pattern as the "Total Visitors" chart card
// (CardHeader + CardAction + ToggleGroup, with a Select fallback on mobile).
// Dialog/7ovr are grid lightboxes; cambio/zoom are single-image zoom demos.
export function ImagePreviewDemo() {
  const t = useTranslations("ImagePreview")
  const [mode, setMode] = useState<PreviewMode>("dialog")

  const zoomSrc = IMAGES[0].src

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
            <ToggleGroupItem value="dialog">{t("modeDialog")}</ToggleGroupItem>
            <ToggleGroupItem value="7ovr">{t("mode7ovr")}</ToggleGroupItem>
            <ToggleGroupItem value="cambio">{t("modeCambio")}</ToggleGroupItem>
            <ToggleGroupItem value="zoom">{t("modeZoom")}</ToggleGroupItem>
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
              <SelectValue placeholder={t("modeDialog")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(["dialog", "7ovr", "cambio", "zoom"] as PreviewMode[]).map(
                (m) => (
                  <SelectItem key={m} value={m} className="rounded-lg">
                    {t(MODE_KEYS[m])}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {mode === "dialog" && (
          <ImageLightbox images={IMAGES} title={t("title")} />
        )}
        {mode === "7ovr" && <GalleryBlock />}
        {mode === "cambio" && (
          <div className="mx-auto max-w-xl">
            <CambioImage
              src={IMAGES[0].src}
              alt={IMAGES[0].alt}
              width={800}
              height={600}
              controls
              dismissible
              showExpandIcon
            />
          </div>
        )}
        {mode === "zoom" && (
          <div className="mx-auto max-w-xl">
            <ImageZoom>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomSrc}
                alt={IMAGES[0].alt}
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
            </ImageZoom>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t("zoomHint")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
