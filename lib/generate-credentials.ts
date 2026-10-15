import bcrypt from "bcryptjs"

/**
 * Turns a company name into a clean username.
 * "Destora-Technology Ltd." → "destora-technology"
 */
export function generateUsername(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars except spaces and hyphens
    .replace(/\s+/g, "-")          // Replace spaces with hyphens
    .replace(/-+/g, "-")           // Collapse multiple hyphens
    .replace(/^-|-$/g, "")         // Trim leading/trailing hyphens
    .slice(0, 50)                  // Max 50 chars
}

/**
 * Generates a strong random password like "Pulse-A7k2-Mx9q"
 */
export function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  const segment = (len: number) =>
    Array.from({ length: len }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("")
  
  return `Pulse-${segment(4)}-${segment(4)}`
}

/**
 * Hashes a plain password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verifies a plain password against a hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}