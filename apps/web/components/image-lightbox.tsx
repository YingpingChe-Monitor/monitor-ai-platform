"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExpandIcon,
  ImageOffIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type LightboxImage = {
  id: string
  src: string
  alt: string
  caption?: string
  location?: string
}

// Self-built shadcn lightbox: a responsive thumbnail grid where clicking a
// tile opens a Dialog with the full image, prev/next navigation, index
// indicator and keyboard support (Esc/arrows — Base UI Dialog handles Esc
// and focus; arrows are wired below). Zero dependencies beyond installed
// shadcn primitives; themeable via base-nova tokens.
export function ImageLightbox({
  images,
  title,
}: {
  images: LightboxImage[]
  title: string
}) {
  const t = useTranslations("ImagePreview")
  const [index, setIndex] = useState<number | null>(null)
  const open = index !== null
  const current = index !== null ? images[index] : null

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((prev) =>
        prev === null ? prev : (prev + dir + images.length) % images.length
      )
    },
    [images.length]
  )

  // Arrow-key navigation while the lightbox is open.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, go])

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${t("open")}: ${image.alt}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-foreground/10 transition-transform duration-200 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="size-full object-cover"
              onError={(e) => {
                // Fallback: replace a broken remote image with a gradient block.
                const el = e.currentTarget
                el.style.display = "none"
                el.nextElementSibling?.classList.remove("hidden")
              }}
            />
            <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-brand/30 to-primary/30">
              <ImageOffIcon className="size-6 text-primary-foreground/70" />
            </div>
            <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="flex items-center gap-1 text-xs font-medium text-white">
                <ExpandIcon className="size-3.5" />
                {image.caption ?? image.alt}
              </span>
            </span>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(next) => !next && setIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 bg-black/90 p-0 text-white ring-0 sm:max-w-4xl"
        >
          {/* Visually hidden for a11y; visible caption is rendered below. */}
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {current?.alt}
          </DialogDescription>

          <div className="relative flex min-h-72 items-center justify-center">
            {current && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={current.id}
                src={current.src}
                alt={current.alt}
                className="max-h-[75dvh] w-auto max-w-full object-contain"
              />
            )}

            {/* Prev / next */}
            <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("previous")}
                onClick={() => go(-1)}
                className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <ChevronLeftIcon className="size-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("next")}
                onClick={() => go(1)}
                className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <ChevronRightIcon className="size-6" />
              </Button>
            </div>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("close")}
              onClick={() => setIndex(null)}
              className="absolute top-3 right-3 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <span className="text-lg leading-none">×</span>
            </Button>
          </div>

          {/* Caption + index bar */}
          <div
            className={cn(
              "flex items-center justify-between gap-4 border-t border-white/15 px-4 py-2.5 text-sm"
            )}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{current?.caption ?? current?.alt}</p>
              {current?.location && (
                <p className="text-white/60 text-xs">{current.location}</p>
              )}
            </div>
            <p className="text-white/60 text-xs whitespace-nowrap tabular-nums">
              {index !== null ? index + 1 : 0} / {images.length}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
