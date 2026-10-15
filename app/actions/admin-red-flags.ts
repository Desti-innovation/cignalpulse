"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { clearFlag, flagUser } from "@/lib/red-flags"
import { logAdminAction } from "@/lib/audit"
import { revalidatePath } from "next/cache"

export type RedFlagRow = {
  id: number
  user_id: number
  username: string
  company_name: string
  email: string
  reason: string
  severity: string
  details: Record<string, unknown> | null
  triggered_by: string
  status: string
  flagged_at: string
  cleared_at: string | null
  cleared_notes: string | null
}

export type RedFlagStats = {
  activeFlags: number
  flaggedUsers: number
  clearedThisMonth: number
  highSeverityActive: number
}

export async function listRedFlags(status: "active" | "cleared" | "all" = "active"): Promise<RedFlagRow[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      r.id, r.user_id, u.username, u.company_name, u.email,
      r.reason, r.severity, r.details, r.triggered_by,
      r.status, r.flagged_at, r.cleared_at, r.cleared_notes
    FROM red_flags r
    INNER JOIN users u ON r.user_id = u.id
    WHERE ${status === "all" ? sql`1=1` : sql`r.status = ${status}`}
    ORDER BY r.flagged_at DESC
    LIMIT 200
  `

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    username: r.username,
    company_name: r.company_name,
    email: r.email,
    reason: r.reason,
    severity: r.severity,
    details: (r.details as Record<string, unknown> | null) ?? null,
    triggered_by: r.triggered_by,
    status: r.status,
    flagged_at: r.flagged_at instanceof Date ? r.flagged_at.toISOString() : String(r.flagged_at),
    cleared_at: r.cleared_at instanceof Date ? r.cleared_at.toISOString() : (r.cleared_at ? String(r.cleared_at) : null),
    cleared_notes: r.cleared_notes,
  }))
}

export async function getRedFlagStats(): Promise<RedFlagStats> {
  const session = await getAdminSession()
  const empty = { activeFlags: 0, flaggedUsers: 0, clearedThisMonth: 0, highSeverityActive: 0 }
  if (!session) return empty

  const [row] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'active')::int AS active_flags,
      COUNT(DISTINCT user_id) FILTER (WHERE status = 'active')::int AS flagged_users,
      COUNT(*) FILTER (WHERE status = 'cleared' AND cleared_at >= DATE_TRUNC('month', NOW()))::int AS cleared_month,
      COUNT(*) FILTER (WHERE status = 'active' AND severity = 'high')::int AS high_severity
    FROM red_flags
  `

  return {
    activeFlags: row?.active_flags ?? 0,
    flaggedUsers: row?.flagged_users ?? 0,
    clearedThisMonth: row?.cleared_month ?? 0,
    highSeverityActive: row?.high_severity ?? 0,
  }
}

export async function clearRedFlagAction(
  flagId: number,
  notes?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    await clearFlag({
      flagId,
      adminId: session.adminId,
      notes,
      restoreSending: true,
    })

    await logAdminAction({
      action: "enable_user",
      targetType: "user",
      metadata: { clearedFlagId: flagId, notes },
    })

    revalidatePath("/admin/red-flags")
    return { success: true, message: "Flag cleared. User can send again." }
  } catch (error) {
    console.error("Clear flag failed:", error)
    return { success: false, error: "Failed to clear flag." }
  }
}

export async function manualFlagUserAction(
  userId: number,
  reason: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    await flagUser({
      userId,
      reason: "manual_flag",
      severity: "high",
      details: { reason },
      triggeredBy: "admin",
    })

    await logAdminAction({
      action: "disable_user",
      targetType: "user",
      targetId: userId,
      metadata: { manualFlagReason: reason },
    })

    revalidatePath("/admin/red-flags")
    return { success: true, message: "User flagged." }
  } catch (error) {
    return { success: false, error: "Failed to flag user." }
  }
}