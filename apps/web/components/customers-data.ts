// Shared types & option constants for the 客户 (Customers) feature.
// The mock records live in `app/(app)/sales/customers/data.json`; label
// values are i18n keys resolved with useTranslations("Customers") at render.

export const INDUSTRIES = ["manufacturing", "energy", "finance", "other"] as const
export const REGIONS = ["east", "south", "north", "southwest", "other"] as const
export const SOURCES = ["online", "exhibition", "referral", "self"] as const

export type Industry = (typeof INDUSTRIES)[number]
export type Region = (typeof REGIONS)[number]
export type Source = (typeof SOURCES)[number]

export type CustomerRecord = {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  industry: Industry | ""
  region: Region | ""
  source: Source | ""
  address: string
  createdAt: string
}

export const INDUSTRY_LABELS: Record<Industry, string> = {
  manufacturing: "industryManufacturing",
  energy: "industryEnergy",
  finance: "industryFinance",
  other: "industryOther",
}

export const REGION_LABELS: Record<Region, string> = {
  east: "regionEast",
  south: "regionSouth",
  north: "regionNorth",
  southwest: "regionSouthwest",
  other: "regionOther",
}

export const SOURCE_LABELS: Record<Source, string> = {
  online: "sourceOnline",
  exhibition: "sourceExhibition",
  referral: "sourceReferral",
  self: "sourceSelf",
}
