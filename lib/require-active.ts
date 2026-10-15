import "server-only"
import { sql } from "@/lib/db"
import { getSession, deleteSession } from "@/lib/session"
import { getAdminSession, deleteAdminSession } from "@/lib/admin-session"
import { INACTIVITY_TIMEOUT_MINUTES } from "@/lib/activity"

export class IdleTimeoutError extends Error {
  constructor() {
    super("Session timed out due to inactivity.")
    this.name = "IdleTimeoutError"
  }
}

/**
 * Returns the current user session, or throws IdleTimeoutError if inactive.
 * Also refreshes last_activity_at.
 * Use this at the top of any user server action that must respect the timeout.
 */
export async function requireActiveUser() {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated.")

  const [user] = await sql`
    SELECT last_activity_at FROM users WHERE id = ${session.userId} LIMIT 1
  `
  if (!user) throw new Error("User not found.")

  if (user.last_activity_at) {
    const elapsed =
      Date.now() - new Date(user.last_activity_at).getTime()
    const timeoutMs = (INACTIVITY_TIMEOUT_MINUTES * 60 + 30) * 1000

    if (elapsed > timeoutMs) {
      await deleteSession()
      throw new IdleTimeoutError()
    }
  }

  await sql`
    UPDATE users SET last_activity_at = NOW() WHERE id = ${session.userId}
  `

  return session
}

export async function requireActiveAdmin() {
  const session = await getAdminSession()
  if (!session) throw new Error("Not authenticated.")

  const [admin] = await sql`
    SELECT last_activity_at FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) throw new Error("Admin not found.")

  if (admin.last_activity_at) {
    const elapsed = Date.now() - new Date(admin.last_activity_at).getTime()
    const timeoutMs = (INACTIVITY_TIMEOUT_MINUTES * 60 + 30) * 1000

    if (elapsed > timeoutMs) {
      await deleteAdminSession()
      throw new IdleTimeoutError()
    }
  }

  await sql`
    UPDATE admins SET last_activity_at = NOW() WHERE id = ${session.adminId}
  `

  return session
}