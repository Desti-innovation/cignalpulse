"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"

// ============================================================
// Types
// ============================================================

export type AuditLogRow = {
  id: number
  admin_id: number | null
  admin_username: string | null
  action: string
  target_type: string | null
  target_id: number | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export type AuditStats = {
  total: number
  today: number
  last7Days: number
  uniqueAdmins: number
}

export type AuditFilters = {
  search?: string
  action?: string
  adminId?: number
  fromDate?: string // YYYY-MM-DD
  toDate?: string   // YYYY-MM-DD
  limit?: number
  offset?: number
}

// ============================================================
// Read: list audit logs (with optional filters)
// ============================================================

export async function listAuditLogs(filters: AuditFilters = {}): Promise<AuditLogRow[]> {
  const session = await getAdminSession()
  if (!session) return []

  const limit = Math.min(filters.limit ?? 200, 500)
  const offset = filters.offset ?? 0

  const rows = await sql`
    SELECT 
      id,
      admin_id,
      admin_username,
      action,
      target_type,
      target_id,
      metadata,
      ip_address,
      created_at
    FROM admin_audit_log
    WHERE 
      (${filters.action ?? null}::text IS NULL OR action = ${filters.action ?? null})
      AND (${filters.adminId ?? null}::int IS NULL OR admin_id = ${filters.adminId ?? null})
      AND (${filters.search ?? null}::text IS NULL OR (
        action ILIKE ${"%" + (filters.search ?? "") + "%"}
        OR admin_username ILIKE ${"%" + (filters.search ?? "") + "%"}
        OR target_type ILIKE ${"%" + (filters.search ?? "") + "%"}
      ))
      AND (${filters.fromDate ?? null}::date IS NULL OR created_at >= ${filters.fromDate ?? null}::date)
      AND (${filters.toDate ?? null}::date IS NULL OR created_at < (${filters.toDate ?? null}::date + INTERVAL '1 day'))
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `

  return rows.map((r) => ({
    id: r.id,
    admin_id: r.admin_id,
    admin_username: r.admin_username,
    action: r.action,
    target_type: r.target_type,
    target_id: r.target_id,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    ip_address: r.ip_address ?? null,
    created_at:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  }))
}

// ============================================================
// Read: stats for the header cards
// ============================================================

export async function getAuditStats(): Promise<AuditStats> {
  const session = await getAdminSession()
  if (!session) {
    return { total: 0, today: 0, last7Days: 0, uniqueAdmins: 0 }
  }

  const [row] = await sql`
    SELECT 
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE created_at >= NOW()::date
      )::int AS today,
      COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '7 days'
      )::int AS last_7_days,
      COUNT(DISTINCT admin_id)::int AS unique_admins
    FROM admin_audit_log
  `

  return {
    total: row?.total ?? 0,
    today: row?.today ?? 0,
    last7Days: row?.last_7_days ?? 0,
    uniqueAdmins: row?.unique_admins ?? 0,
  }
}

// ============================================================
// Read: list of distinct actions (for the filter dropdown)
// ============================================================

export async function listAuditActions(): Promise<string[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT DISTINCT action
    FROM admin_audit_log
    ORDER BY action ASC
  `

  return rows.map((r) => r.action as string)
}

// ============================================================
// Read: full detail for a single log entry
// ============================================================

export async function getAuditLogDetail(logId: number): Promise<AuditLogRow | null> {
  const session = await getAdminSession()
  if (!session) return null

  const [row] = await sql`
    SELECT 
      id, admin_id, admin_username, action,
      target_type, target_id, metadata, ip_address, created_at
    FROM admin_audit_log
    WHERE id = ${logId}
    LIMIT 1
  `

  if (!row) return null

  return {
    id: row.id,
    admin_id: row.admin_id,
    admin_username: row.admin_username,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    ip_address: row.ip_address ?? null,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }
}

// ============================================================
// Read: recent activity for a specific admin
// ============================================================

export async function getRecentActivityForAdmin(
  adminId: number,
  limit: number = 10
): Promise<AuditLogRow[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      id, admin_id, admin_username, action,
      target_type, target_id, metadata, ip_address, created_at
    FROM admin_audit_log
    WHERE admin_id = ${adminId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    id: r.id,
    admin_id: r.admin_id,
    admin_username: r.admin_username,
    action: r.action,
    target_type: r.target_type,
    target_id: r.target_id,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    ip_address: r.ip_address ?? null,
    created_at:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  }))
}