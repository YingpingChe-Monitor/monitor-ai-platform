"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ArrowLeftIcon, Loader2Icon } from "lucide-react"

import { getSession, type Session } from "@/lib/auth"
import { getCustomerAccess } from "@/lib/customer-access"
import { createCustomer, getAllCustomers, updateCustomer } from "@/lib/customers-store"
import { PageContainer } from "@/components/page-container"
import {
  INDUSTRIES,
  REGIONS,
  SOURCES,
  INDUSTRY_LABELS,
  REGION_LABELS,
  SOURCE_LABELS,
  type CustomerRecord,
  type Industry,
  type Region,
  type Source,
} from "@/components/customers-data"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Per-field error map: every violated rule is reported at once on submit,
// and a field's error clears as soon as its input changes. Only the name is
// required; phone/email are optional but format-checked when filled. The
// name must also be unique (trimmed, case-insensitive) across all customers.
type FieldErrors = {
  name?: "required" | "duplicate"
  phone?: "invalid"
  email?: "invalid"
}

// Phone formats (China): 11-digit mobile starting 1[3-9], or landline with an
// 0-prefixed area code + 7-8 digit number. Optional +86/86 prefix; spaces and
// dashes are tolerated as separators (stripped before matching).
const PHONE_PATTERNS = [
  /^(?:\+?86)?1[3-9]\d{9}$/,
  /^(?:\+?86)?0\d{2,3}\d{7,8}$/,
]

const EMPTY = {
  name: "",
  contact: "",
  phone: "",
  email: "",
  industry: "" as Industry | "",
  region: "" as Region | "",
  source: "" as Source | "",
  address: "",
}

/**
 * Create / edit form for a customer record. With `id` (plus the seed for
 * resolution) → edit mode, prefilled from the mock store, submit saves and
 * returns to the detail page; without → create mode, submit persists and
 * opens the new customer's detail. Mock persistence: localStorage overrides.
 */
export function CustomersForm({
  customers,
  id: editingId,
}: {
  customers: CustomerRecord[]
  id?: string
}) {
  const t = useTranslations("Customers")
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [initial, setInitial] = useState<CustomerRecord | null>(null)
  const [name, setName] = useState(EMPTY.name)
  const [contact, setContact] = useState(EMPTY.contact)
  const [phone, setPhone] = useState(EMPTY.phone)
  const [email, setEmail] = useState(EMPTY.email)
  const [industry, setIndustry] = useState<Industry | "">(EMPTY.industry)
  const [region, setRegion] = useState<Region | "">(EMPTY.region)
  const [source, setSource] = useState<Source | "">(EMPTY.source)
  const [address, setAddress] = useState(EMPTY.address)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Reading localStorage is an external-system check that can only run
    // client-side; flipping these flags here is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const s = getSession()
    setSession(s)
    if (editingId) {
      const record = getAllCustomers(customers).find((c) => c.id === editingId) ?? null
      setInitial(record)
      if (record) {
        setName(record.name)
        setContact(record.contact)
        setPhone(record.phone)
        setEmail(record.email)
        setIndustry(record.industry)
        setRegion(record.region)
        setSource(record.source)
        setAddress(record.address)
      }
    }
  }, [])

  if (!session) return null
  const access = getCustomerAccess(session)

  if (editingId && !initial) {
    return (
      <PageContainer>
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{t("notFoundTitle")}</CardTitle>
            <CardDescription>{t("notFoundDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/sales/customers" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              {t("backToList")}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  if (!access.canManageAll) {
    const ownId = session.user.customerId
    return (
      <PageContainer>
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{t("noPermissionTitle")}</CardTitle>
            <CardDescription>
              {editingId ? t("noPermissionEdit") : t("noPermissionCreate")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={ownId ? `/sales/customers/${ownId}` : "/sales/customers"} />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              {t("backToMyCustomer")}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  function clearFieldError(field: keyof FieldErrors) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate everything at once so all violations are shown together.
    const next: FieldErrors = {}
    const trimmedName = name.trim()
    if (!trimmedName) next.name = "required"
    else {
      const taken = getAllCustomers(customers).some(
        (c) => c.id !== editingId && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
      if (taken) next.name = "duplicate"
    }
    const trimmedPhone = phone.trim()
    const phoneDigits = trimmedPhone.replace(/[\s-]/g, "")
    if (trimmedPhone && !PHONE_PATTERNS.some((pattern) => pattern.test(phoneDigits))) {
      next.phone = "invalid"
    }
    const trimmedEmail = email.trim()
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) next.email = "invalid"

    setErrors(next)
    if (next.name || next.phone || next.email) return

    const draft = {
      name: name.trim(),
      contact: contact.trim(),
      phone: trimmedPhone,
      email: trimmedEmail,
      industry,
      region,
      source,
      address: address.trim(),
    }

    setSubmitting(true)
    // Small delay so the loading state is visible (mock submit is synchronous).
    window.setTimeout(() => {
      setSubmitting(false)
      if (editingId) {
        updateCustomer(editingId, draft)
        toast.success(t("saveSuccess"))
        router.push(`/sales/customers/${editingId}`)
      } else {
        const record = createCustomer(draft)
        toast.success(t("success"))
        router.push(`/sales/customers/${record.id}`)
      }
    }, 500)
  }

  return (
    <PageContainer>
      {initial && (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("editTitle")}</h1>
          <p className="text-muted-foreground text-sm">
            {initial.name} · {t("overviewId")}：{initial.id}
          </p>
        </div>
      )}
      <Card className="@container/card mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{t("formTitle")}</CardTitle>
          <CardDescription>
            {editingId ? t("editDescription") : t("formDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 @2xl/card:grid-cols-2">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="cust-name">{t("name")}</FieldLabel>
                  <Input
                    id="cust-name"
                    placeholder={t("namePlaceholder")}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      clearFieldError("name")
                    }}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name === "required" && (
                    <FieldDescription className="text-destructive">
                      {t("errorNameRequired")}
                    </FieldDescription>
                  )}
                  {errors.name === "duplicate" && (
                    <FieldDescription className="text-destructive">
                      {t("errorNameDuplicate")}
                    </FieldDescription>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="cust-contact">{t("contact")}</FieldLabel>
                  <Input
                    id="cust-contact"
                    placeholder={t("contactPlaceholder")}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </Field>
                <Field data-invalid={!!errors.phone}>
                  <FieldLabel htmlFor="cust-phone">{t("phone")}</FieldLabel>
                  <Input
                    id="cust-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder={t("phonePlaceholder")}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      clearFieldError("phone")
                    }}
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone === "invalid" && (
                    <FieldDescription className="text-destructive">
                      {t("errorPhoneInvalid")}
                    </FieldDescription>
                  )}
                </Field>
                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="cust-email">{t("email")}</FieldLabel>
                  <Input
                    id="cust-email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearFieldError("email")
                    }}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email === "invalid" && (
                    <FieldDescription className="text-destructive">
                      {t("errorEmailInvalid")}
                    </FieldDescription>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="cust-industry">{t("industry")}</FieldLabel>
                  <Select
                    value={industry || null}
                    onValueChange={(v) => setIndustry((v ?? "") as Industry | "")}
                  >
                    <SelectTrigger id="cust-industry" className="w-full">
                      <SelectValue placeholder={t("industryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {t(INDUSTRY_LABELS[item])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cust-region">{t("region")}</FieldLabel>
                  <Select
                    value={region || null}
                    onValueChange={(v) => setRegion((v ?? "") as Region | "")}
                  >
                    <SelectTrigger id="cust-region" className="w-full">
                      <SelectValue placeholder={t("regionPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {t(REGION_LABELS[item])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="@2xl/card:col-span-2">
                  <FieldLabel htmlFor="cust-source">{t("source")}</FieldLabel>
                  <Select
                    value={source || null}
                    onValueChange={(v) => setSource((v ?? "") as Source | "")}
                  >
                    <SelectTrigger id="cust-source" className="w-full">
                      <SelectValue placeholder={t("sourcePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {t(SOURCE_LABELS[item])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="@2xl/card:col-span-2">
                  <FieldLabel htmlFor="cust-address">{t("address")}</FieldLabel>
                  <Textarea
                    id="cust-address"
                    placeholder={t("addressPlaceholder")}
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2Icon data-icon="inline-start" className="animate-spin" />
                      {t("submitting")}
                    </>
                  ) : editingId ? (
                    t("save")
                  ) : (
                    t("submit")
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
