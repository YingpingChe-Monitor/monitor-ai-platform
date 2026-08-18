"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// Fully-controlled hover popover state, used together with Popover (not
// HoverCard): Base UI's PreviewCard (shadcn HoverCard) relies on Floating
// UI's safePolygon to keep the card open while the pointer travels from the
// trigger to the content, and that detection fails in nested-portal
// scenarios (e.g. inside a DropdownMenu) — the card closes mid-move and the
// options become unclickable. Popover has no built-in hover logic, so the
// open/close state is 100% owned by the mouse handlers wired to this hook:
// - open when the trigger is hovered
// - stay open while the pointer is inside the trigger OR the card content
// - close after the pointer leaves both, with a grace delay (default 1000ms)
//   so a slow move from trigger to card still lands on the card
export function useHoverCardOpen(graceDelay = 1000) {
  const [open, setOpen] = useState(false)
  const insideRef = useRef(false)
  const timerRef = useRef<number | undefined>(undefined)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  // Pointer entered the trigger.
  const openCard = useCallback(() => {
    insideRef.current = true
    clearTimer()
    setOpen(true)
  }, [clearTimer])

  // Pointer entered the card content: cancel any pending close.
  const keepOpen = useCallback(() => {
    insideRef.current = true
    clearTimer()
  }, [clearTimer])

  // Pointer left the trigger: if it reaches the card within the grace delay
  // (keepOpen), stay open; otherwise close.
  const scheduleClose = useCallback(() => {
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      if (!insideRef.current) setOpen(false)
    }, graceDelay)
  }, [clearTimer, graceDelay])

  // Pointer left the card content (and nothing else re-entered): close.
  const closeCard = useCallback(() => {
    insideRef.current = false
    clearTimer()
    setOpen(false)
  }, [clearTimer])

  useEffect(() => clearTimer, [clearTimer])

  return { open, openCard, keepOpen, scheduleClose, closeCard }
}
