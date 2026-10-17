"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { decryptPhone } from "@/lib/phone-crypto" // 👈 Added

export type SenderIdRequestDetail = {
  id: number
  request_id: string
  sender_id: string
  company_name: string
  email: string
  phone: string
  use_case: string
  website: string
  notes: string | null
  status: string
  gateway_status: string | null
  submitted_at: string
  approved_at: string | null
  reviewed_at: string | null
  created_user_id: number | null
  created_user_username: string | null
}

export type GatewayLog = {
  id: number
  action: string
  gateway_status: string | null
  response_payload: Record<string, unknown> | null
  admin_username: string | null
  created_at: string
}

export async function getSenderIdRequestDetail(
  requestDbId: number
): Promise<SenderIdRequestDetail | null> {
  const session = await getAdminSession()
  if (!session) return null

  const [row] = await sql`
    SELECT 
      r.id, r.request_id, r.sender_id, r.company_name, r.email, r.phone,
      r.use_case, r.website, r.notes, r.status, r.gateway_status,
      r.submitted_at, r.approved_at, r.reviewed_at, r.created_user_id,
      u.username AS created_user_username
    FROM sender_id_requests r
    LEFT JOIN users u ON r.created_user_id = u.id
    WHERE r.id = ${requestDbId}
    LIMIT 1
  `

  if (!row) return null

  return {
    ...row,
    // 👈 Decrypt the phone so the Admin UI can read it
    phone: row.phone ? decryptPhone(row.phone) : "",
    
    submitted_at: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : String(row.submitted_at),
    approved_at: row.approved_at instanceof Date ? row.approved_at.toISOString() : (row.approved_at ? String(row.approved_at) : null),
    reviewed_at: row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : (row.reviewed_at ? String(row.reviewed_at) : null),
  } as SenderIdRequestDetail
}

export async function getGatewayLogs(requestDbId: number): Promise<GatewayLog[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      g.id, g.action, g.gateway_status, g.response_payload, g.created_at,
      a.username AS admin_username
    FROM sender_id_gateway_logs g
    LEFT JOIN admins a ON g.performed_by = a.id
    WHERE g.request_id = ${requestDbId}
    ORDER BY g.created_at DESC
  `

  return rows.map((r) => ({
    ...r,
    response_payload: (r.response_payload as Record<string, unknown> | null) ?? null,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  })) as GatewayLog[]
}