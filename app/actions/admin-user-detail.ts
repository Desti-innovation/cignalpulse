"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"

export type UserDetail = {
  id: number
  username: string
  email: string
  company_name: string
  display_name: string | null
  logo_url: string | null
  role: string
  is_active: boolean
  sending_status: string
  first_login: boolean
  profile_completed: boolean
  created_at: string
  last_login_at: string | null
  sender_id: string | null
  request_id: string | null
  request_status: string | null
  gateway_status: string | null
  wallet_balance_ghs: number
  sms_credits: number
  lifetime_topup_ghs: number
}

export type UserCampaign = {
  id: number
  campaign_id: string
  sender_id: string
  message: string
  recipient_count: number
  total_sent: number
  total_delivered: number
  total_failed: number
  status: string
  sent_at: string | null
}

export type UserTransaction = {
  id: number
  reference: string
  type: string
  amount_ghs: number
  credits: number
  bonus_credits: number
  status: string
  initiated_at: string
}

export type UserRedFlag = {
  id: number
  reason: string
  severity: string
  status: string
  flagged_at: string
  cleared_at: string | null
}

export async function getUserDetail(userId: number): Promise<UserDetail | null> {
  const session = await getAdminSession()
  if (!session) return null

  const [row] = await sql`
    SELECT 
      u.id, u.username, u.email, u.company_name, u.display_name, u.logo_url,
      u.role, u.is_active, u.sending_status, u.first_login, u.profile_completed,
      u.created_at,
      r.sender_id, r.request_id, r.status AS request_status, r.gateway_status,
      COALESCE(w.balance_ghs, 0)::numeric AS wallet_balance_ghs,
      COALESCE(w.sms_credits, 0)::int AS sms_credits,
      COALESCE(w.lifetime_topup_ghs, 0)::numeric AS lifetime_topup_ghs
    FROM users u
    LEFT JOIN sender_id_requests r ON u.sender_id_request_id = r.id
    LEFT JOIN user_wallets w ON w.user_id = u.id
    WHERE u.id = ${userId}
    LIMIT 1
  `

  if (!row) return null

  return {
    ...row,
    wallet_balance_ghs: Number(row.wallet_balance_ghs),
    lifetime_topup_ghs: Number(row.lifetime_topup_ghs),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    last_login_at: row.last_login_at
      ? row.last_login_at instanceof Date
        ? row.last_login_at.toISOString()
        : String(row.last_login_at)
      : null,
  } as UserDetail
}

export async function getUserCampaigns(userId: number, limit = 10): Promise<UserCampaign[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT id, campaign_id, sender_id, message, recipient_count,
           total_sent, total_delivered, total_failed, status, sent_at
    FROM sms_campaigns
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    ...r,
    sent_at: r.sent_at instanceof Date ? r.sent_at.toISOString() : (r.sent_at ? String(r.sent_at) : null),
  })) as UserCampaign[]
}

export async function getUserTransactions(userId: number, limit = 10): Promise<UserTransaction[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT id, reference, type, amount_ghs, credits, bonus_credits, status, initiated_at
    FROM transactions
    WHERE user_id = ${userId}
    ORDER BY initiated_at DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    ...r,
    amount_ghs: Number(r.amount_ghs),
    initiated_at: r.initiated_at instanceof Date ? r.initiated_at.toISOString() : String(r.initiated_at),
  })) as UserTransaction[]
}

export async function getUserRedFlags(userId: number): Promise<UserRedFlag[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT id, reason, severity, status, flagged_at, cleared_at
    FROM red_flags
    WHERE user_id = ${userId}
    ORDER BY flagged_at DESC
  `

  return rows.map((r) => ({
    ...r,
    flagged_at: r.flagged_at instanceof Date ? r.flagged_at.toISOString() : String(r.flagged_at),
    cleared_at: r.cleared_at instanceof Date ? r.cleared_at.toISOString() : (r.cleared_at ? String(r.cleared_at) : null),
  })) as UserRedFlag[]
}