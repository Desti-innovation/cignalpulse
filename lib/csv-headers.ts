/**
 * CSV header alias list + auto-detection.
 *
 * When users upload a CSV, we try to auto-map their column names
 * to our internal fields. If a column doesn't match any alias,
 * the UI asks the user to map it manually.
 */

export const HEADER_ALIASES: Record<string, string[]> = {
  phone: [
    "phone",
    "phone_number",
    "phonenumber",
    "mobile",
    "mobile_number",
    "mobilenumber",
    "tel",
    "telephone",
    "telephone_number",
    "contact",
    "contact_number",
    "contactnumber",
    "number",
    "msisdn",
    "cell",
    "cellphone",
    "cell_phone",
  ],
  first_name: [
    "first_name",
    "firstname",
    "fname",
    "given_name",
    "givenname",
    "given",
    "first",
  ],
  last_name: [
    "last_name",
    "lastname",
    "lname",
    "surname",
    "family_name",
    "familyname",
    "family",
    "last",
  ],
}

export type CsvField = "phone" | "first_name" | "last_name" | "skip"

/**
 * Normalizes a header: trims, lowercases, and collapses
 * spaces/dashes to underscores.
 */
function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/_+/g, "_")
}

/**
 * Given an array of CSV header strings, returns a mapping:
 *   { "Mobile Number" → "phone", "First Name" → "first_name", ... }
 * Columns that couldn't be matched are omitted (user maps manually).
 */
export function detectColumnMapping(
  headers: string[]
): Record<string, CsvField> {
  const mapping: Record<string, CsvField> = {}

  for (const rawHeader of headers) {
    const normalized = normalizeHeader(rawHeader)

    let matched = false
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(normalized)) {
        mapping[rawHeader] = field as CsvField
        matched = true
        break
      }
    }

    if (!matched) {
      // Leave unmapped for the user to decide (or skip)
      mapping[rawHeader] = "skip"
    }
  }

  return mapping
}

/**
 * Checks if a set of column mappings contains all required fields
 * (phone is mandatory, first/last are optional).
 */
export function hasRequiredMapping(
  mapping: Record<string, CsvField>
): boolean {
  return Object.values(mapping).includes("phone")
}