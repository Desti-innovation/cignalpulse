"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"

export type RecentActivity = {
  id: number
  admin_username: string | null
  action: string
  target_type: string | null
  target_id: number | null
  created_at: string
}

export type AttentionItems = {
  pendingSenderIds: number
  activeRedFlags: number
  failedTransactions: number
  pendingSenderIdList: Array<{ id: number; sender_id: string; company_name: string }>
}

export async function getRecentAdminActivity(limit = 8): Promise<RecentActivity[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT id, admin_username, action, target_type, target_id, created_at
    FROM admin_audit_log
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    id: r.id,
    admin_username: r.admin_username,
    action: r.action,
    target_type: r.target_type,
    target_id: r.target_id,
    created_at:
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  })) as RecentActivity[]
}

export async function getAttentionItems(): Promise<AttentionItems> {
  const session = await getAdminSession()
  const empty: AttentionItems = {
    pendingSenderIds: 0,
    activeRedFlags: 0,
    failedTransactions: 0,
    pendingSenderIdList: [],
  }
  if (!session) return empty

  const [counts] = await sql`
    SELECT
      (SELECT COUNT(*) FROM sender_id_requests WHERE status = 'pending')::int AS pending_sender_ids,
      (SELECT COUNT(*) FROM red_flags WHERE status = 'active')::int AS active_flags,
      (SELECT COUNT(*) FROM transactions WHERE status = 'failed' AND initiated_at >= NOW() - INTERVAL '7 days')::int AS failed_tx
  `

  const list = await sql`
    SELECT id, sender_id, company_name
    FROM sender_id_requests
    WHERE status = 'pending'
    ORDER BY submitted_at DESC
    LIMIT 5
  `

  return {
    pendingSenderIds: counts.pending_sender_ids,
    activeRedFlags: counts.active_flags,
    failedTransactions: counts.failed_tx,
    pendingSenderIdList: list as Array<{
      id: number
      sender_id: string
      company_name: string
    }>,
  }
}