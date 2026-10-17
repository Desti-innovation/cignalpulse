import "server-only"
import crypto from "crypto"

// Load keys from env
const ENCRYPTION_KEY = Buffer.from(process.env.PHONE_ENCRYPTION_KEY || "", "base64")
const HASH_SECRET = process.env.PHONE_HASH_SECRET || ""

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error("PHONE_ENCRYPTION_KEY must be exactly 32 bytes (base64 encoded)")
}
if (!HASH_SECRET) {
  throw new Error("PHONE_HASH_SECRET is missing")
}

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // GCM standard
const AUTH_TAG_LENGTH = 16

/**
 * Normalizes a phone number to a standard format before encrypting/hashing.
 * Example: "+233 59 342 5854" -> "233593425854"
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  // Assume Ghana if no country code is provided (9-10 digits)
  if (digits.length <= 10 && !phone.startsWith("+")) {
    return `233${digits.slice(-9)}`
  }
  return digits
}

/**
 * Encrypts a phone number using AES-256-GCM.
 * Returns a string format: iv:authTag:encryptedData (all hex)
 */
export function encryptPhone(phone: string): string {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return ""

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
  
  let encrypted = cipher.update(normalized, "utf8", "hex")
  encrypted += cipher.final("hex")
  
  const authTag = cipher.getAuthTag().toString("hex")
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`
}

/**
 * Decrypts a phone number.
 */
export function decryptPhone(encryptedData: string): string {
  if (!encryptedData) return ""
  
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":")
    if (!ivHex || !authTagHex || !encryptedHex) return ""

    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
    
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8")
    decrypted += decipher.final("utf8")
    
    return decrypted
  } catch (error) {
    console.error("[crypto] Failed to decrypt phone number:", error)
    return ""
  }
}

/**
 * Generates a blind index (hash) for exact-match searching.
 * HMAC-SHA256 ensures it can't be brute-forced without the hash secret.
 */
export function hashPhone(phone: string): string {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return ""
  
  return crypto
    .createHmac("sha256", HASH_SECRET)
    .update(normalized)
    .digest("hex")
}