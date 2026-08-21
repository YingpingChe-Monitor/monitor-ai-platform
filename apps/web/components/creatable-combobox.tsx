"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

export type ComboboxOption = { value: string; label: string }

// Searchable combobox with free-form input, built on the official Base UI
// Combobox (via the shadcn base-nova wrapper in components/ui/combobox.tsx).
// - typing filters the options (tokenized: every whitespace-separated token
//   must match — "华 信" matches 华信科技, not the literal "华 信")
// - clicking an option selects it (value + label)
// - with `allowCreate`, a non-matching input shows a "create" affordance and
//   keeps the typed text as a free-form value (the parent decides whether to
//   actually create the entity — e.g. a confirm dialog on submit)
// - without `allowCreate` (filters), non-matching input just shows `emptyText`
//
// Focus management (caret staying in the input after selection) is handled by
// Base UI itself — no manual refocusing needed.
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
  const labelByValue = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const o of options) map.set(o.value, o.label)
    return map
  }, [options])

  // Object values ({ value, label } shape) — Base UI resolves labels/values
  // automatically from that shape. The selected record must be referentially
  // the same as the item rendered in the list for default equality to hold.
  const selected = options.find((o) => o.value === value) ?? null

  // Tokenized filtering: every whitespace-separated token of the query must
  // be a substring of the option label.
  const filter = React.useCallback(
    (item: ComboboxOption, query: string) => {
      const label = item.label ?? String(item)
      const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
      if (tokens.length === 0) return true
      const l = label.toLowerCase()
      return tokens.every((tok) => l.includes(tok))
    },
    []
  )

  function handleValueChange(next: ComboboxOption | null) {
    // Selecting an option: keep value + input text in sync.
    const id = next?.value ?? ""
    onValueChange(id)
    onTextChange(id ? (labelByValue.get(id) ?? "") : "")
  }

  function handleInputChange(
    next: string,
    eventDetails?: { reason?: string }
  ) {
    // Only real user typing may update the free-form text. Base UI also calls
    // onInputValueChange when it syncs the input to the selected label after
    // close (reason: none / input-clear / item-press) — honouring those would
    // wipe a free-form value that matches no option the moment the popup
    // closes.
    const reason = eventDetails?.reason
    if (
      reason &&
      reason !== "input-change" &&
      reason !== "input-paste"
    ) {
      return
    }
    onTextChange(next)
    // Diverging from the selected option drops the selection, so the parent
    // treats the typed text as a free-form value.
    const selectedLabel = value ? labelByValue.get(value) : undefined
    if (selectedLabel !== undefined && next !== selectedLabel) onValueChange("")
  }

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={handleValueChange}
      inputValue={text}
      onInputValueChange={handleInputChange}
      open={open}
      onOpenChange={setOpen}
      filter={filter}
      autoHighlight
    >
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      <ComboboxContent>
        <ComboboxEmpty>
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
        </ComboboxEmpty>
        <ComboboxList>
          {(item: ComboboxOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
