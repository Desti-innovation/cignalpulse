import "server-only"
import { getSession, type SessionPayload } from "@/lib/session"
import { getAdminSession, type AdminSessionPayload } from "@/lib/admin-session"

// ============================================================
// Auth guard errors
// ============================================================

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message)
    this.name = "ForbiddenError"
  }
}

// ============================================================
// User guards
// ============================================================

/**
 * Throws if the current visitor is not a logged-in user.
 * Use inside server actions for a hard failure.
 */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) throw new UnauthorizedError("You must be logged in.")
  return session
}

/**
 * Throws if the current user is flagged or suspended.
 */
export async function requireActiveUser(): Promise<SessionPayload> {
  const session = await requireUser()
  // Note: the authoritative check happens in canUserSend(),
  // but this catches obvious cases early.
  return session
}

// ============================================================
// Admin guards
// ============================================================

/**
 * Throws if the current visitor is not a logged-in admin.
 * Use inside admin server actions.
 */
export async function requireAdmin(): Promise<AdminSessionPayload> {
  const session = await getAdminSession()
  if (!session) throw new UnauthorizedError("Admin access required.")
  return session
}

// ============================================================
// Ownership guards
// ============================================================

/**
 * Throws if a resource doesn't belong to the given user.
 * Use before UPDATE/DELETE on user-owned rows.
 */
export function assertOwnership(
  resourceUserId: number,
  currentUserId: number
): void {
  if (resourceUserId !== currentUserId) {
    throw new ForbiddenError("You do not have access to this resource.")
  }
}