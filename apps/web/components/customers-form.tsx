"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"

import { PageContainer, PageGrid } from "@/components/page-container"
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

const INDUSTRIES = ["manufacturing", "energy", "finance", "other"] as const
const REGIONS = ["east", "south", "north", "southwest", "other"] as const
const SOURCES = ["online", "exhibition", "referral", "self"] as const

type Industry = (typeof INDUSTRIES)[number]
type Region = (typeof REGIONS)[number]
type Source = (typeof SOURCES)[number]

// Base UI Select yields `string | null` — wrap every onValueChange with ?? "".
type FormError =
  | "name-required"
  | "contact-required"
  | "phone-required"
  | "phone-invalid"
  | "email-required"
  | "email-invalid"
  | null

const INDUSTRY_LABELS: Record<Industry, string> = {
  manufacturing: "industryManufacturing",
  energy: "industryEnergy",
  finance: "industryFinance",
  other: "industryOther",
}

const REGION_LABELS: Record<Region, string> = {
  east: "regionEast",
  south: "regionSouth",
  north: "regionNorth",
  southwest: "regionSouthwest",
  other: "regionOther",
}

const SOURCE_LABELS: Record<Source, string> = {
  online: "sourceOnline",
  exhibition: "sourceExhibition",
  referral: "sourceReferral",
  self: "sourceSelf",
}

type SubmittedCustomer = {
  name: string
  contact: string
  phone: string
  email: string
  industry: Industry | ""
  region: Region | ""
  source: Source | ""
  address: string
}

export function CustomersForm() {
  const t = useTranslations("Customers")

  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [industry, setIndustry] = useState<Industry | "">("")
  const [region, setRegion] = useState<Region | "">("")
  const [source, setSource] = useState<Source | "">("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState<FormError>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<SubmittedCustomer | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("name-required")
      return
    }
    if (!contact.trim()) {
      setError("contact-required")
      return
    }
    const trimmedPhone = phone.trim()
    if (!trimmedPhone) {
      setError("phone-required")
      return
    }
    if (!/^\+?\d[\d\s-]{5,}$/.test(trimmedPhone)) {
      setError("phone-invalid")
      return
    }
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("email-required")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("email-invalid")
      return
    }
    setError(null)
    setSubmitting(true)
    // Small delay so the loading state is visible (mock submit is synchronous).
    window.setTimeout(() => {
      setSubmitting(false)
      setSubmitted({
        name: name.trim(),
        contact: contact.trim(),
        phone: trimmedPhone,
        email: trimmedEmail,
        industry,
        region,
        source,
        address: address.trim(),
      })
      toast.success(t("success"))
    }, 500)
  }

  return (
    <PageContainer>
      <PageGrid>
        {/* Form card — the aside result card is only shown after submission. */}
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-2xl">{t("formTitle")}</CardTitle>
            <CardDescription>{t("formDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 @2xl/card:grid-cols-2">
                  <Field data-invalid={error === "name-required"}>
                    <FieldLabel htmlFor="cust-name">{t("name")}</FieldLabel>
                    <Input
                      id="cust-name"
                      placeholder={t("namePlaceholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={error === "name-required"}
                    />
                    {error === "name-required" && (
                      <FieldDescription className="text-destructive">
                        {t("errorNameRequired")}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field data-invalid={error === "contact-required"}>
                    <FieldLabel htmlFor="cust-contact">{t("contact")}</FieldLabel>
                    <Input
                      id="cust-contact"
                      placeholder={t("contactPlaceholder")}
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      aria-invalid={error === "contact-required"}
                    />
                    {error === "contact-required" && (
                      <FieldDescription className="text-destructive">
                        {t("errorContactRequired")}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field data-invalid={error === "phone-required" || error === "phone-invalid"}>
                    <FieldLabel htmlFor="cust-phone">{t("phone")}</FieldLabel>
                    <Input
                      id="cust-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder={t("phonePlaceholder")}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      aria-invalid={error === "phone-required" || error === "phone-invalid"}
                    />
                    {error === "phone-required" && (
                      <FieldDescription className="text-destructive">
                        {t("errorPhoneRequired")}
                      </FieldDescription>
                    )}
                    {error === "phone-invalid" && (
                      <FieldDescription className="text-destructive">
                        {t("errorPhoneInvalid")}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field data-invalid={error === "email-required" || error === "email-invalid"}>
                    <FieldLabel htmlFor="cust-email">{t("email")}</FieldLabel>
                    <Input
                      id="cust-email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={error === "email-required" || error === "email-invalid"}
                    />
                    {error === "email-required" && (
                      <FieldDescription className="text-destructive">
                        {t("errorEmailRequired")}
                      </FieldDescription>
                    )}
                    {error === "email-invalid" && (
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
                    ) : (
                      t("submit")
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {/* Result card — mirrors the submitted values, stays empty until submit. */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">{t("resultTitle")}</CardTitle>
            <CardDescription>
              {submitted ? t("resultDescription") : t("resultPlaceholder")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <dl className="flex flex-col gap-3">
                <ResultRow label={t("resultName")} value={submitted.name} />
                <ResultRow label={t("resultContact")} value={submitted.contact} />
                <ResultRow label={t("resultPhone")} value={submitted.phone} />
                <ResultRow label={t("resultEmail")} value={submitted.email} />
                <ResultRow
                  label={t("resultIndustry")}
                  value={submitted.industry ? t(INDUSTRY_LABELS[submitted.industry]) : t("empty")}
                />
                <ResultRow
                  label={t("resultRegion")}
                  value={submitted.region ? t(REGION_LABELS[submitted.region]) : t("empty")}
                />
                <ResultRow
                  label={t("resultSource")}
                  value={submitted.source ? t(SOURCE_LABELS[submitted.source]) : t("empty")}
                />
                <ResultRow label={t("resultAddress")} value={submitted.address || t("empty")} />
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">{t("resultPlaceholder")}</p>
            )}
          </CardContent>
        </Card>
      </PageGrid>
    </PageContainer>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-medium break-all text-sm">{value}</dd>
    </div>
  )
}
