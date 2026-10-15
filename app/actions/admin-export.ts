"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { logAdminAction } from "@/lib/audit"

export type ExportTable = "users" | "transactions" | "campaigns" | "sender_id_requests"

export type ExportResult = {
  success: boolean
  csv?: string
  filename?: string
  error?: string
  rowCount?: number
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ]
  return lines.join("\n")
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export async function exportTableAction(table: ExportTable): Promise<ExportResult> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    let rows: Record<string, unknown>[] = []
    let filename = ""

    if (table === "users") {
      const result = await sql`
        SELECT 
          u.id, u.username, u.email, u.company_name, u.display_name,
          u.role, u.is_active, u.sending_status, u.created_at,
          r.sender_id, r.status AS request_status,
          COALESCE(w.balance_ghs, 0) AS wallet_balance,
          COALESCE(w.sms_credits, 0) AS sms_credits,
          COALESCE(w.lifetime_topup_ghs, 0) AS lifetime_topup
        FROM users u
        LEFT JOIN sender_id_requests r ON u.sender_id_request_id = r.id
        LEFT JOIN user_wallets w ON w.user_id = u.id
        ORDER BY u.created_at DESC
      `
      rows = result as Record<string, unknown>[]
      filename = `users-${timestamp()}.csv`
    } else if (table === "transactions") {
      const result = await sql`
        SELECT 
          t.id, t.reference, t.type, u.username, u.email, u.company_name,
          b.name AS bundle_name, p.code AS promo_code,
          t.amount_ghs, t.credits, t.bonus_credits,
          t.gateway, t.status, t.initiated_at, t.completed_at, t.refunded_at
        FROM transactions t
        INNER JOIN users u ON t.user_id = u.id
        LEFT JOIN sms_bundles b ON t.bundle_id = b.id
        LEFT JOIN promos p ON t.promo_id = p.id
        ORDER BY t.initiated_at DESC
      `
      rows = result as Record<string, unknown>[]
      filename = `transactions-${timestamp()}.csv`
    } else if (table === "campaigns") {
      const result = await sql`
        SELECT 
          c.id, c.campaign_id, u.username, u.company_name,
          c.sender_id, c.message, c.recipient_count,
          c.total_sent, c.total_delivered, c.total_failed, c.total_rejected,
          c.credits_used, c.status, c.sent_at, c.created_at
        FROM sms_campaigns c
        INNER JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `
      rows = result as Record<string, unknown>[]
      filename = `campaigns-${timestamp()}.csv`
    } else if (table === "sender_id_requests") {
      const result = await sql`
        SELECT 
          r.id, r.request_id, r.sender_id, r.company_name, r.email, r.phone,
          r.use_case, r.website, r.status, r.gateway_status,
          r.submitted_at, r.approved_at, r.reviewed_at
        FROM sender_id_requests r
        ORDER BY r.submitted_at DESC
      `
      rows = result as Record<string, unknown>[]
      filename = `sender-id-requests-${timestamp()}.csv`
    } else {
      return { success: false, error: "Unknown table." }
    }

    const csv = toCSV(rows)

    await logAdminAction({
      action: "check_sender_id_status",
      targetType: "system",
      metadata: { exportedTable: table, rowCount: rows.length },
    })

    return { success: true, csv, filename, rowCount: rows.length }
  } catch (error) {
    console.error("Export failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed.",
    }
  }
}