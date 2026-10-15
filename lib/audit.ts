import "server-only"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"

export type AuditAction =
  | "approve_sender_id"
  | "reject_sender_id"
  | "submit_sender_id"
  | "check_sender_id_status"
  | "disable_user"
  | "enable_user"
  | "reset_user_password"
  | "sync_campaign"
  | "admin_login"
  | "admin_logout"

export type AuditTargetType =
  | "sender_id_request"
  | "user"
  | "campaign"
  | "system"

interface LogOptions {
  action: AuditAction
  targetType?: AuditTargetType
  targetId?: number
  metadata?: Record<string, unknown>
}

/**
 * Logs an admin action. Fails silently (logs to console) so it never
 * blocks the primary operation if the audit table has an issue.
 */
export async function logAdminAction(opts: LogOptions): Promise<void> {
  try {
    const session = await getAdminSession()
    if (!session) return

    await sql`
      INSERT INTO admin_audit_log (
        admin_id, admin_username, action, target_type, target_id, metadata
      ) VALUES (
        ${session.adminId},
        ${session.username},
        ${opts.action},
        ${opts.targetType ?? null},
        ${opts.targetId ?? null},
        ${opts.metadata ? JSON.stringify(opts.metadata) : null}::jsonb
      )
    `
  } catch (error) {
    console.error("[audit] Failed to log admin action:", error)
  }
}