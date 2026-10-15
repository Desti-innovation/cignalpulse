/**
 * Phone number normalization and validation.
 * Ghana-focused, but written so international can be turned on later.
 */

const GHANA_COUNTRY_CODE = "233"

export type NormalizedPhone = {
  valid: boolean
  normalized?: string       // "233241234567" — no +, no spaces
  display?: string          // "+233 24 123 4567" — pretty format
  reason?: string           // error reason if invalid
  isInternational?: boolean
}

/**
 * Strips everything except digits, then normalizes to Ghana format.
 */
export function normalizePhone(input: string): NormalizedPhone {
  if (!input || typeof input !== "string") {
    return { valid: false, reason: "Empty input" }
  }

  // Remove all non-digit characters (but remember if there was a +)
  const hadPlus = input.trim().startsWith("+")
  const digits = input.replace(/\D/g, "")

  if (digits.length === 0) {
    return { valid: false, reason: "No digits found" }
  }

  // Case 1: Already has country code → 233XXXXXXXXX (12 digits)
  if (digits.startsWith(GHANA_COUNTRY_CODE) && digits.length === 12) {
    const rest = digits.slice(3)
    if (isValidGhanaLocal(rest)) {
      return {
        valid: true,
        normalized: digits,
        display: formatGhanaDisplay(rest),
      }
    }
  }

  // Case 2: Local format with leading 0 → 0241234567 (10 digits)
  if (digits.startsWith("0") && digits.length === 10) {
    const rest = digits.slice(1)
    if (isValidGhanaLocal(rest)) {
      return {
        valid: true,
        normalized: GHANA_COUNTRY_CODE + rest,
        display: formatGhanaDisplay(rest),
      }
    }
  }

  // Case 3: Bare local → 241234567 (9 digits)
  if (digits.length === 9 && isValidGhanaLocal(digits)) {
    return {
      valid: true,
      normalized: GHANA_COUNTRY_CODE + digits,
      display: formatGhanaDisplay(digits),
    }
  }

  // Case 4: Has a + but not Ghana → international
  if (hadPlus && !digits.startsWith(GHANA_COUNTRY_CODE)) {
    return {
      valid: false,
      reason: "International numbers coming soon. Ghana only for now.",
      isInternational: true,
    }
  }

  // Case 5: Non-Ghana, no + prefix, wrong length → treat as invalid or international
  if (digits.length > 12) {
    return {
      valid: false,
      reason: "Number too long",
    }
  }

  return {
    valid: false,
    reason: "Invalid Ghana phone number",
  }
}

function isValidGhanaLocal(local: string): boolean {
  // Ghana mobile numbers start with 2, 5, 4, 3, 7, or 9
  // and are 9 digits total (after the leading 0 is stripped)
  if (local.length !== 9) return false
  const firstDigit = local[0]
  return ["2", "5", "4", "3", "7", "9"].includes(firstDigit)
}

function formatGhanaDisplay(local: string): string {
  // local is 9 digits, e.g. "241234567"
  if (local.length !== 9) return `+233 ${local}`
  const parts = [
    local.slice(0, 2),  // 24
    local.slice(2, 5),  // 123
    local.slice(5, 9),  // 4567
  ]
  return `+233 ${parts[0]} ${parts[1]} ${parts[2]}`
}

/**
 * Splits a big blob of text into individual candidate phone numbers.
 * Supports newlines, commas, semicolons, and spaces between numbers.
 */
export function parsePhoneList(raw: string): {
  valid: string[]               // normalized numbers
  invalid: Array<{ raw: string; reason: string }>
  duplicates: number
  international: number
} {
  if (!raw || !raw.trim()) {
    return { valid: [], invalid: [], duplicates: 0, international: 0 }
  }

  // Split by newlines, commas, semicolons. Then by spaces if needed.
  const tokens = raw
    .split(/[\n,;]+/)
    .flatMap((line) => line.trim().split(/\s+/))
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  const validSet = new Set<string>()
  const invalid: Array<{ raw: string; reason: string }> = []
  let duplicates = 0
  let international = 0

  for (const token of tokens) {
    const result = normalizePhone(token)
    if (result.valid && result.normalized) {
      if (validSet.has(result.normalized)) {
        duplicates++
      } else {
        validSet.add(result.normalized)
      }
    } else {
      if (result.isInternational) {
        international++
      }
      invalid.push({ raw: token, reason: result.reason || "Invalid" })
    }
  }

  return {
    valid: Array.from(validSet),
    invalid,
    duplicates,
    international,
  }
}