"use client"

import * as React from "react"
import { CheckIcon, PlusIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type ComboboxOption = { value: string; label: string }

// Searchable combobox with free-form input:
// - typing filters the options (substring, case-insensitive)
// - clicking an option selects it (value + label)
// - with `allowCreate`, a non-matching input shows a "create" affordance and
//   keeps the typed text as a free-form value (the parent decides whether to
//   actually create the entity — e.g. a confirm dialog on submit)
// - without `allowCreate` (filters), non-matching input just shows
//   `emptyText`
//
// Deliberately NOT built on cmdk: the Command component steals the Space key
// while its popup is open (it uses Space to select the highlighted item),
// which breaks typing anything with spaces in the input. A plain list keeps
// all keystrokes in the input.
export function CreatableCombobox({
  options,
  value,
  onValueChange,
  text,
  onTextChange,
  placeholder,
  disabled,
  allowCreate = false,
  emptyText = "No matches",
  createLabel,
  className,
}: {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  text: string
  onTextChange: (text: string) => void
  placeholder?: string
  disabled?: boolean
  allowCreate?: boolean
  emptyText?: string
  createLabel?: (text: string) => string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const selected = options.find((o) => o.value === value)
  // `text` is the displayed value (parent-controlled); `query` is what the
  // user is actively typing — filtering must only use the latter, otherwise
  // opening a filter that already has a selection would filter by the
  // selected label and show a single row.
  //
  // Tokenized search: split the query on whitespace and require EVERY token
  // to be a substring of the label. "华 信" matches 华信科技 (contains both
  // 华 and 信), not just labels containing the literal "华 信".
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const filtered = tokens.length
    ? options.filter((o) => {
        const label = o.label.toLowerCase()
        return tokens.every((tok) => label.includes(tok))
      })
    : options

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // Reset the filter when the dropdown closes so the next open shows all
    // options (opening mid-typing must NOT reset, so this only runs on close).
    if (!next) setQuery("")
  }

  function handleTextChange(next: string) {
    onTextChange(next)
    setQuery(next)
    // Diverging from the selected option drops the selection, so the parent
    // treats the typed text as a free-form value.
    if (selected && next !== selected.label) onValueChange("")
    // Typing opens the dropdown (click-to-open is handled by the trigger).
    setOpen(true)
  }

  function handleSelect(option: ComboboxOption) {
    onValueChange(option.value)
    onTextChange(option.label)
    setQuery("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {/* The trigger renders a wrapping div, NOT the input itself: Base UI's
          button semantics would otherwise land on the <input> — with
          nativeButton=true it forces type="button" (can't type at all) and
          with nativeButton=false it steals the Space key (button activation).
          On the wrapper, keydown's target !== currentTarget, so typing is
          untouched while clicks still toggle the dropdown.
          Width comes from `className` on the wrapper (w-36 / w-40 / w-full…);
          the input fills it. */}
      <PopoverTrigger
        nativeButton={false}
        render={
          <div className={cn("w-full", className)}>
            <Input
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              aria-expanded={open}
              role="combobox"
            />
          </div>
        }
      />
      <PopoverContent
        align="start"
        sideOffset={4}
        className="min-w-(--anchor-width) p-1"
      >
        {filtered.length > 0 ? (
          <ul className="no-scrollbar max-h-72 overflow-y-auto p-1">
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent",
                    option.value === value && "text-foreground"
                  )}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.value === value && (
                    <CheckIcon className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {allowCreate && text.trim() ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-primary"
                onClick={() => setOpen(false)}
              >
                <PlusIcon className="size-4" />
                {createLabel?.(text.trim())}
              </button>
            ) : (
              emptyText
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
