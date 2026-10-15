import "server-only"
import { sql } from "@/lib/db"

export type ResolvedContact = {
  userId: number
  email: string | null
  phone: string | null
}

/**
 * Returns the user's canonical contact info:
 *  - email: from users.email
 *  - phone: users.phone, OR fallback to latest approved sender_id_request
 */
export async function resolveUserContact(
  userId: number
): Promise<ResolvedContact | null> {
  const [row] = await sql`
    SELECT
      u.id,
      u.email,
      u.phone AS user_phone,
      s.phone AS fallback_phone
    FROM users u
    LEFT JOIN LATERAL (
      SELECT phone
      FROM sender_id_requests
      WHERE created_user_id = u.id
        AND status = 'approved'
        AND phone IS NOT NULL
      ORDER BY approved_at DESC NULLS LAST
      LIMIT 1
    ) s ON true
    WHERE u.id = ${userId}
    LIMIT 1
  `

  if (!row) return null

  const phone =
    normalizePhone(row.user_phone) ??
    normalizePhone(row.fallback_phone) ??
    null

  return {
    userId: row.id,
    email: row.email ?? null,
    phone,
  }
}

export async function resolveUserContactByIdentifier(
  identifier: string
): Promise<ResolvedContact | null> {
  const cleaned = identifier.trim().toLowerCase()
  if (!cleaned) return null

  const [user] = await sql`
    SELECT id
    FROM users
    WHERE LOWER(username) = ${cleaned} OR LOWER(email) = ${cleaned}
    LIMIT 1
  `

  if (!user) return null
  return resolveUserContact(user.id)
}

function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  const hasPlus = trimmed.startsWith("+")
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length < 9 || digits.length > 15) return null

  return hasPlus ? `+${digits}` : digits
}