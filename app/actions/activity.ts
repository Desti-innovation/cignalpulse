"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getAdminSession } from "@/lib/admin-session"

// const TIMEOUT_MS = (5 * 60 + 30) * 1000
const TIMEOUT_MS = 5 * 60 * 1000

/**
 * Called by the frontend periodically to refresh the user's
 * last_activity_at timestamp. Also acts as a session validity check.
 *
 * NOTE: This action does NOT delete cookies. If the session is expired,
 * it returns { valid: false } and the client calls /api/logout (a route
 * handler) to actually clear the cookie. Cookie mutations inside server
 * actions are unreliable in Next 15 and cause "unexpected response" errors.
 */
export async function touchUserActivity(): Promise<{
  valid: boolean
  reason?: string
}> {
  try {
    const session = await getSession()
    if (!session) return { valid: false, reason: "no_session" }

    // Single round-trip: conditional update + return
    const rows = await sql`
      UPDATE users
      SET last_activity_at = NOW()
      WHERE id = ${session.userId}
        AND (
          last_activity_at IS NULL
          OR NOW() - last_activity_at < ${`${TIMEOUT_MS} milliseconds`}::interval
        )
      RETURNING id
    `

    if (rows.length === 0) {
      return { valid: false, reason: "idle_timeout" }
    }

    return { valid: true }
  } catch (error) {
    console.error("[touchUserActivity] Failed:", error)
    return { valid: false, reason: "error" }
  }
}

/**
 * Same as above, for admins.
 */
export async function touchAdminActivity(): Promise<{
  valid: boolean
  reason?: string
}> {
  try {
    const session = await getAdminSession()
    if (!session) return { valid: false, reason: "no_session" }

    const rows = await sql`
      UPDATE admins
      SET last_activity_at = NOW()
      WHERE id = ${session.adminId}
        AND (
          last_activity_at IS NULL
          OR NOW() - last_activity_at < ${`${TIMEOUT_MS} milliseconds`}::interval
        )
      RETURNING id
    `

    if (rows.length === 0) {
      return { valid: false, reason: "idle_timeout" }
    }

    return { valid: true }
  } catch (error) {
    console.error("[touchAdminActivity] Failed:", error)
    return { valid: false, reason: "error" }
  }
}