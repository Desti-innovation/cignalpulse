"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

// ============================================================
// Types
// ============================================================

export type CampaignRow = {
  id: number
  campaignId: string
  senderId: string
  message: string
  mode: string
  recipientCount: number
  totalSent: number
  totalDelivered: number
  totalFailed: number
  totalRejected: number
  creditsUsed: number
  status: string
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
}

export type CampaignsStats = {
  totalCampaigns: number
  totalSent: number
  totalDelivered: number
  deliveryRate: number
  thisMonthCount: number
}

export type CampaignForReload = {
  id: number
  mode: "individual" | "bulk" | "group"
  senderId: string
  message: string
  recipients: string[]
  scheduledAt: string | null
}

// ============================================================
// Read — list all campaigns for the current user
// ============================================================

export async function listUserCampaigns(
  filters: { status?: "sent" | "scheduled" | "draft" | "failed"; limit?: number } = {}
): Promise<CampaignRow[]> {
  const session = await getSession()
  if (!session) return []

  const limit = Math.min(filters.limit ?? 100, 500)

  const rows = await sql`
    SELECT 
      id, campaign_id, sender_id, message, mode,
      recipient_count, total_sent, total_delivered, total_failed, total_rejected,
      credits_used, status, scheduled_at, sent_at, created_at
    FROM sms_campaigns
    WHERE user_id = ${session.userId}
      AND (${filters.status ?? null}::text IS NULL OR status = ${filters.status ?? null})
    ORDER BY 
      CASE 
        WHEN status = 'scheduled' THEN 0
        WHEN status = 'draft' THEN 1
        ELSE 2
      END ASC,
      COALESCE(scheduled_at, created_at) DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    id: r.id,
    campaignId: r.campaign_id,
    senderId: r.sender_id,
    message: r.message,
    mode: r.mode ?? "bulk",
    recipientCount: r.recipient_count,
    totalSent: r.total_sent,
    totalDelivered: r.total_delivered,
    totalFailed: r.total_failed,
    totalRejected: r.total_rejected,
    creditsUsed: r.credits_used,
    status: r.status,
    scheduledAt: r.scheduled_at
      ? r.scheduled_at instanceof Date
        ? r.scheduled_at.toISOString()
        : String(r.scheduled_at)
      : null,
    sentAt: r.sent_at
      ? r.sent_at instanceof Date
        ? r.sent_at.toISOString()
        : String(r.sent_at)
      : null,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  })) as CampaignRow[]
}

// ============================================================
// Read — summary stats
// ============================================================

export async function getUserCampaignStats(): Promise<CampaignsStats> {
  const session = await getSession()
  const empty = {
    totalCampaigns: 0,
    totalSent: 0,
    totalDelivered: 0,
    deliveryRate: 0,
    thisMonthCount: 0,
  }
  if (!session) return empty

  const [row] = await sql`
    SELECT
      COUNT(*)::int AS total_campaigns,
      COALESCE(SUM(total_sent), 0)::int AS total_sent,
      COALESCE(SUM(total_delivered), 0)::int AS total_delivered,
      COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()))::int AS this_month
    FROM sms_campaigns
    WHERE user_id = ${session.userId}
  `

  const totalSent = row?.total_sent ?? 0
  const totalDelivered = row?.total_delivered ?? 0

  return {
    totalCampaigns: row?.total_campaigns ?? 0,
    totalSent,
    totalDelivered,
    deliveryRate:
      totalSent > 0
        ? Math.round((totalDelivered / totalSent) * 1000) / 10
        : 0,
    thisMonthCount: row?.this_month ?? 0,
  }
}

// ============================================================
// Read — fetch a single campaign for reload ("Send Again" / drafts)
// ============================================================

export async function getCampaignForReload(
  campaignDbId: number
): Promise<CampaignForReload | null> {
  const session = await getSession()
  if (!session) return null

  const [row] = await sql`
    SELECT 
      id, mode, sender_id, message, recipients_json, scheduled_at
    FROM sms_campaigns
    WHERE id = ${campaignDbId} AND user_id = ${session.userId}
    LIMIT 1
  `

  if (!row) return null

  const recipients = Array.isArray(row.recipients_json)
    ? (row.recipients_json as string[])
    : []

  return {
    id: row.id,
    mode: (row.mode ?? "bulk") as "individual" | "bulk" | "group",
    senderId: row.sender_id ?? "",
    message: row.message ?? "",
    recipients,
    scheduledAt: row.scheduled_at
      ? row.scheduled_at instanceof Date
        ? row.scheduled_at.toISOString()
        : String(row.scheduled_at)
      : null,
  }
}