/**
 * Reusable validation helpers for user input.
 * Every input from a form or API should pass through one of these.
 */

// ============================================================
// Primitive validators
// ============================================================

export function validateEmail(email: string): {
  valid: boolean
  error?: string
} {
  const trimmed = email.trim()
  if (!trimmed) return { valid: false, error: "Email is required." }
  if (trimmed.length > 254) return { valid: false, error: "Email is too long." }

  // Simple but strict RFC-lite pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address." }
  }
  return { valid: true }
}

export function validatePhone(phone: string): {
  valid: boolean
  error?: string
} {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return { valid: false, error: "Phone number is required." }
  if (digits.length < 9 || digits.length > 15) {
    return { valid: false, error: "Phone number must be 9-15 digits." }
  }
  return { valid: true }
}

export function validateUsername(username: string): {
  valid: boolean
  error?: string
} {
  const trimmed = username.trim()
  if (!trimmed) return { valid: false, error: "Username is required." }
  if (trimmed.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters." }
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Username is too long." }
  }
  // Letters, numbers, hyphens, underscores only
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, - and _",
    }
  }
  return { valid: true }
}

export function validateSenderId(senderId: string): {
  valid: boolean
  error?: string
} {
  const trimmed = senderId.trim().toUpperCase()
  if (!trimmed) return { valid: false, error: "Sender ID is required." }
  if (trimmed.length > 11) {
    return { valid: false, error: "Sender ID must be 11 characters or less." }
  }
  // STRICT: Letters and numbers only. No spaces allowed for new requests.
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Sender ID can only contain letters and numbers.",
    }
  }
  return { valid: true }
}

export function validateMessage(message: string): {
  valid: boolean
  error?: string
} {
  const trimmed = message.trim()
  if (!trimmed) return { valid: false, error: "Message is required." }
  if (trimmed.length > 1000) {
    return { valid: false, error: "Message must be 1000 characters or less." }
  }
  return { valid: true }
}

export function validateUrl(url: string): {
  valid: boolean
  error?: string
} {
  const trimmed = url.trim()
  if (!trimmed) return { valid: false, error: "URL is required." }
  if (trimmed.length > 500) return { valid: false, error: "URL is too long." }
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "Only HTTP and HTTPS URLs are allowed." }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: "Please enter a valid URL." }
  }
}

// ============================================================
// Numeric validators
// ============================================================

export function validatePositiveNumber(
  value: unknown,
  options: { min?: number; max?: number; label?: string } = {}
): { valid: boolean; error?: string; value?: number } {
  const num = typeof value === "string" ? parseFloat(value) : Number(value)
  if (isNaN(num)) {
    return { valid: false, error: `${options.label ?? "Value"} must be a number.` }
  }
  if (options.min !== undefined && num < options.min) {
    return {
      valid: false,
      error: `${options.label ?? "Value"} must be at least ${options.min}.`,
    }
  }
  if (options.max !== undefined && num > options.max) {
    return {
      valid: false,
      error: `${options.label ?? "Value"} must be no more than ${options.max}.`,
    }
  }
  return { valid: true, value: num }
}

// ============================================================
// String validators
// ============================================================

export function validateString(
  value: unknown,
  options: {
    required?: boolean
    minLength?: number
    maxLength?: number
    label?: string
    pattern?: RegExp
  } = {}
): { valid: boolean; error?: string; value?: string } {
  const str = typeof value === "string" ? value.trim() : ""

  if (options.required && !str) {
    return { valid: false, error: `${options.label ?? "Field"} is required.` }
  }

  if (str.length > 0) {
    if (options.minLength && str.length < options.minLength) {
      return {
        valid: false,
        error: `${options.label ?? "Field"} must be at least ${options.minLength} characters.`,
      }
    }
    if (options.maxLength && str.length > options.maxLength) {
      return {
        valid: false,
        error: `${options.label ?? "Field"} must be no more than ${options.maxLength} characters.`,
      }
    }
    if (options.pattern && !options.pattern.test(str)) {
      return { valid: false, error: `${options.label ?? "Field"} is invalid.` }
    }
  }

  return { valid: true, value: str }
}

// ============================================================
// Array validators
// ============================================================

export function validateRecipientArray(
  value: unknown,
  options: { min?: number; max?: number } = {}
): { valid: boolean; error?: string; value?: string[] } {
  const min = options.min ?? 1
  const max = options.max ?? 10000

  if (!Array.isArray(value)) {
    return { valid: false, error: "Recipients must be an array." }
  }
  if (value.length < min) {
    return { valid: false, error: `At least ${min} recipient is required.` }
  }
  if (value.length > max) {
    return { valid: false, error: `Maximum ${max} recipients per campaign.` }
  }

  const cleaned = value
    .filter((r): r is string => typeof r === "string")
    .map((r) => r.trim())
    .filter(Boolean)

  if (cleaned.length === 0) {
    return { valid: false, error: "No valid recipients found." }
  }

  return { valid: true, value: cleaned }
}

// ============================================================
// Object sanitizers
// ============================================================

/**
 * Strips any character that isn't printable ASCII or common unicode.
 * Prevents control characters, null bytes, and invisible attack vectors.
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars
    .slice(0, maxLength)
    .trim()
}

/**
 * Escapes HTML characters. Use when rendering user content into
 * contexts where you can't rely on React's auto-escaping.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}