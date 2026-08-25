"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Option = { value: string; label: string }

// Tokenized filter shared by the searchable comboboxes: every
// whitespace-separated token must be a substring of the label
// ("华 信" matches 华信科技, not the literal "华 信").
function tokenFilter(query: string) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return () => true
  return (o: Option) => {
    const l = o.label.toLowerCase()
    return tokens.every((tok) => l.includes(tok))
  }
}

// ---------------------------------------------------------------------------
// 1. 普通单选（Select，不带搜索）
// ---------------------------------------------------------------------------
function SingleSelectDemo({ options }: { options: Option[] }) {
  const t = useTranslations("Autocomplete")
  const [value, setValue] = React.useState<string>("")
  const label = options.find((o) => o.value === value)?.label ?? ""

  return (
    <Select value={value || null} onValueChange={(v) => setValue(v ?? "")}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("selectPlaceholder")}>
          {(v: string | null) => (v ? options.find((o) => o.value === v)?.label ?? v : null)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
      <CurrentValue value={label} />
    </Select>
  )
}

// ---------------------------------------------------------------------------
// 2. 普通多选（Select multiple，不带搜索）
// ---------------------------------------------------------------------------
function MultiSelectDemo({ options }: { options: Option[] }) {
  const t = useTranslations("Autocomplete")
  const [value, setValue] = React.useState<string[]>([])

  return (
    <Select multiple value={value} onValueChange={(v) => setValue(v ?? [])}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("selectPlaceholder")}>
          {(v: string[] | null) =>
            v && v.length > 0
              ? (v.map((id) => options.find((o) => o.value === id)?.label ?? id).join("、") as unknown as React.ReactNode)
              : null
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
      <CurrentValue
        value={value.map((id) => options.find((o) => o.value === id)?.label ?? id).join("、")}
      />
    </Select>
  )
}

// ---------------------------------------------------------------------------
// 3. 单选 + 模糊搜索（Combobox）
// ---------------------------------------------------------------------------
function SingleComboboxDemo({ options }: { options: Option[] }) {
  const t = useTranslations("Autocomplete")
  const [value, setValue] = React.useState<string>("")
  const [text, setText] = React.useState("")
  const selected = options.find((o) => o.value === value) ?? null

  const filter = React.useCallback(
    (item: Option, query: string) => tokenFilter(query)(item),
    []
  )

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(next) => {
        const id = next?.value ?? ""
        setValue(id)
        setText(id ? (options.find((o) => o.value === id)?.label ?? "") : "")
      }}
      inputValue={text}
      onInputValueChange={(next, details) => {
        // Only real user typing may update the free-form text; Base UI also
        // syncs the input to the selected label on close (reason: none /
        // input-clear / item-press) — honouring those would wipe free text.
        const reason = details?.reason as string | undefined
        if (reason && reason !== "input-change" && reason !== "input-paste") return
        setText(next)
        if (selected && next !== selected.label) setValue("")
      }}
      filter={filter}
      autoHighlight
    >
      <ComboboxInput placeholder={t("searchPlaceholder")} className="w-full" />
      <ComboboxContent>
        <ComboboxEmpty>{t("noMatches")}</ComboboxEmpty>
        <ComboboxList>
          {(item: Option) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
      <CurrentValue value={selected?.label ?? ""} />
    </Combobox>
  )
}

// ---------------------------------------------------------------------------
// 4. 多选 + 模糊搜索（Combobox multiple + chips）
// ---------------------------------------------------------------------------
function MultiComboboxDemo({ options }: { options: Option[] }) {
  const t = useTranslations("Autocomplete")
  const anchorRef = useComboboxAnchor()
  const [value, setValue] = React.useState<Option[]>([])

  const filter = React.useCallback(
    (item: Option, query: string) => tokenFilter(query)(item),
    []
  )

  return (
    <Combobox
      items={options}
      multiple
      value={value}
      onValueChange={(next) => setValue(next ?? [])}
      filter={filter}
      autoComplete="list"
    >
      <ComboboxChips ref={anchorRef} className="w-full">
        <ComboboxValue>
          {(v: Option[] | null) => (
            <React.Fragment>
              {(v ?? []).map((o) => (
                <ComboboxChip key={o.value}>{o.label}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={v && v.length > 0 ? "" : t("searchPlaceholder")}
                className="w-full min-w-0"
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>{t("noMatches")}</ComboboxEmpty>
        <ComboboxList>
          {(item: Option) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
      <CurrentValue
        value={value.map((o) => o.label).join("、")}
      />
    </Combobox>
  )
}

// ---------------------------------------------------------------------------
// 5. 多选 + 模糊搜索 + 输入创建（Combobox multiple + chips + create）
//    参考邀请页签「所属客户」的自由输入创建能力。
// ---------------------------------------------------------------------------
function MultiComboboxCreateDemo({ options }: { options: Option[] }) {
  const t = useTranslations("Autocomplete")
  const anchorRef = useComboboxAnchor()
  const [value, setValue] = React.useState<Option[]>([])
  const [text, setText] = React.useState("")

  const allOptions = React.useMemo(() => {
    const seen = new Set(options.map((o) => o.value))
    const merged = [...options]
    for (const o of value) {
      if (!seen.has(o.value)) {
        merged.push(o)
        seen.add(o.value)
      }
    }
    return merged
  }, [options, value])

  const filter = React.useCallback(
    (item: Option, query: string) => tokenFilter(query)(item),
    []
  )

  function handleInputChange(next: string, details?: { reason?: string }) {
    const reason = details?.reason
    if (reason && reason !== "input-change" && reason !== "input-paste") return
    setText(next)
  }

  // Create a brand-new option from the typed text and add it as a chip.
  function handleCreate() {
    const name = text.trim()
    if (!name) return
    const option: Option = { value: name, label: name }
    setValue((prev) => (prev.some((o) => o.value === option.value) ? prev : [...prev, option]))
    setText("")
  }

  return (
    <Combobox
      items={allOptions}
      multiple
      value={value}
      onValueChange={(next) => setValue(next ?? [])}
      inputValue={text}
      onInputValueChange={handleInputChange}
      filter={filter}
      autoComplete="list"
    >
      <ComboboxChips ref={anchorRef} className="w-full">
        <ComboboxValue>
          {(v: Option[] | null) => (
            <React.Fragment>
              {(v ?? []).map((o) => (
                <ComboboxChip key={o.value}>{o.label}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={v && v.length > 0 ? "" : t("createSearchPlaceholder")}
                className="w-full min-w-0"
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>
          {text.trim() ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-primary"
              onClick={handleCreate}
            >
              <PlusIcon className="size-4" />
              {t("create", { text: text.trim() })}
            </button>
          ) : (
            t("noMatches")
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: Option) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
      <CurrentValue value={value.map((o) => o.label).join("、")} />
    </Combobox>
  )
}

// ---------------------------------------------------------------------------
// 当前选中值展示
// ---------------------------------------------------------------------------
function CurrentValue({ value }: { value?: string }) {
  const t = useTranslations("Autocomplete")
  return (
    <div className="mt-3 flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t("currentValue")}</span>
      {value ? (
        <Badge variant="secondary" className="max-w-full truncate">
          {value}
        </Badge>
      ) : (
        <span className="text-muted-foreground/60">{t("emptyValue")}</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 页面主体
// ---------------------------------------------------------------------------
export function AutocompleteDemo() {
  const t = useTranslations("Autocomplete")

  const options = React.useMemo<Option[]>(
    () => [
      { value: "react", label: t("optReact") },
      { value: "vue", label: t("optVue") },
      { value: "angular", label: t("optAngular") },
      { value: "svelte", label: t("optSvelte") },
      { value: "solid", label: t("optSolid") },
      { value: "typescript", label: t("optTypescript") },
      { value: "javascript", label: t("optJavascript") },
      { value: "python", label: t("optPython") },
      { value: "rust", label: t("optRust") },
      { value: "go", label: t("optGo") },
    ],
    [t]
  )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("singleSelectTitle")}</CardTitle>
          <CardDescription>{t("singleSelectDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SingleSelectDemo options={options} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("multiSelectTitle")}</CardTitle>
          <CardDescription>{t("multiSelectDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <MultiSelectDemo options={options} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("singleSearchTitle")}</CardTitle>
          <CardDescription>{t("singleSearchDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SingleComboboxDemo options={options} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("multiSearchTitle")}</CardTitle>
          <CardDescription>{t("multiSearchDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <MultiComboboxDemo options={options} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("multiCreateTitle")}</CardTitle>
          <CardDescription>{t("multiCreateDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <MultiComboboxCreateDemo options={options} />
        </CardContent>
      </Card>
    </div>
  )
}
