import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Page layout primitives used by pages scaffolded with `/add-page`.
 *
 * Both components are overflow-safe by construction:
 * - `PageContainer` supplies the horizontal padding (`px-4 lg:px-6`,
 *   matching the dashboard) and vertical rhythm the app shell does not add.
 * - `PageGrid` lays a main block and an aside block side by side on wide
 *   containers and stacks them on narrow ones. Columns are fractional with
 *   a zero minimum (`minmax(0, …)`) and every cell is `min-w-0`, so a wide
 *   table, chart, or long word can never push the page wider — the worst
 *   case is the cell content scrolling or wrapping inside its own card.
 *
 * Never put fixed pixel widths (`w-[…]`, `min-w-[…]`) inside grid cells —
 * that is exactly what makes cards overflow the page width.
 */
export function PageContainer({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 px-4 md:gap-6 lg:px-6",
        className
      )}
    >
      {children}
    </div>
  )
}

export function PageGrid({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "@container grid grid-cols-1 gap-4 [&>*]:min-w-0 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,384px)] md:gap-6",
        className
      )}
    >
      {children}
    </div>
  )
}
