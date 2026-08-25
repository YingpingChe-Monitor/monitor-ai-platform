// Mock customer store: seed (data.json) + localStorage overrides, following
// the same refresh-proof pattern as lib/auth.ts (monitor_g5_* keys).
// Created and edited records live in localStorage; replacing this module with
// real API calls is the expected upgrade path.

import type { CustomerRecord, Industry, Region, Source } from "@/components/customers-data"

const CUSTOMERS_OVERRIDE_KEY = "monitor_g5_customers"

export type CustomerDraft = {
  name: string
  contact: string
  phone: string
  email: string
  industry: Industry | ""
  region: Region | ""
  source: Source | ""
  address: string
}

function readOverrides(): Record<string, CustomerRecord> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(CUSTOMERS_OVERRIDE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, CustomerRecord>
  } catch {
    return {}
  }
}

function writeOverrides(map: Record<string, CustomerRecord>) {
  if (typeof window === "undefined") return
  localStorage.setItem(CUSTOMERS_OVERRIDE_KEY, JSON.stringify(map))
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Seed merged with overrides — edited records replace the seed, runtime-created records append. */
export function getAllCustomers(seed: CustomerRecord[]): CustomerRecord[] {
  const overrides = readOverrides()
  const merged = seed.map((c) => ({ ...c, ...(overrides[c.id] ?? {}) }))
  for (const [id, record] of Object.entries(overrides)) {
    if (!seed.some((c) => c.id === id)) merged.push(record)
  }
  return merged
}

export function createCustomer(draft: CustomerDraft): CustomerRecord {
  const record: CustomerRecord = {
    ...draft,
    id: newId(),
    createdAt: new Date().toISOString().slice(0, 10),
  }
  const overrides = readOverrides()
  overrides[record.id] = record
  writeOverrides(overrides)
  return record
}

export function updateCustomer(id: string, draft: CustomerDraft): CustomerRecord {
  const overrides = readOverrides()
  const existing = overrides[id]
  const record: CustomerRecord = existing
    ? { ...existing, ...draft }
    : { ...draft, id, createdAt: new Date().toISOString().slice(0, 10) }
  overrides[id] = record
  writeOverrides(overrides)
  return record
}
