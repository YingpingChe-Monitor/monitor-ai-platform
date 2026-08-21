"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
  const selected = options.find((o) => o.value === value)
  const query = text.trim().toLowerCase()
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query))
    : options

  function handleTextChange(next: string) {
    onTextChange(next)
    // Diverging from the selected option drops the selection, so the parent
    // treats the typed text as a free-form value.
    if (selected && next !== selected.label) onValueChange("")
    setOpen(true)
  }

  function handleSelect(option: ComboboxOption) {
    onValueChange(option.value)
    onTextChange(option.label)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Input
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            aria-expanded={open}
            role="combobox"
          />
        }
      />
      <PopoverContent
        align="start"
        sideOffset={4}
        className="min-w-(--anchor-width) p-1"
      >
        <Command shouldFilter={false}>
          <CommandList>
            {filtered.length > 0 ? (
              <CommandGroup>
                {filtered.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option)}
                  >
                    {option.label}
                    {option.value === value && <CheckMark />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>
                {allowCreate && text.trim() ? (
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1.5 text-primary"
                    onClick={() => setOpen(false)}
                  >
                    <PlusIcon className="size-4" />
                    {createLabel?.(text.trim())}
                  </button>
                ) : (
                  emptyText
                )}
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function CheckMark() {
  return (
    <span className="pointer-events-none ml-auto flex size-4 items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("size-4 text-primary")}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  )
}
