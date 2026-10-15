"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

// ============================================================
// Types
// ============================================================

export type AnalyticsOverview = {
  totalCampaigns: number
  totalSent: number
  totalDelivered: number
  totalFailed: number
  totalRejected: number
  deliveryRate: number
  failureRate: number
  creditsUsed: number
  avgRecipientsPerCampaign: number
}

export type DailyActivityPoint = {
  date: string
  sent: number
  delivered: number
  failed: number
}

export type TopSenderId = {
  senderId: string
  campaigns: number
  sent: number
}

export type RecentCampaign = {
  id: number
  campaignId: string
  senderId: string
  message: string
  recipientCount: number
  totalSent: number
  totalDelivered: number
  deliveryRate: number
  status: string
  createdAt: string
}

export type DeliveryBreakdown = {
  delivered: number
  submitted: number
  failed: number
  rejected: number
  pending: number
}

export type FailedMessage = {
  id: number
  recipient: string
  status: string
  retries: number
  campaignId: string
  campaignSenderId: string
  createdAt: string
}

// ============================================================
// Overview — top stat cards
// ============================================================

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const session = await getSession()
  const empty: AnalyticsOverview = {
    totalCampaigns: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalRejected: 0,
    deliveryRate: 0,
    failureRate: 0,
    creditsUsed: 0,
    avgRecipientsPerCampaign: 0,
  }
  if (!session) return empty

  const [row] = await sql`
    SELECT
      COUNT(*)::int AS total_campaigns,
      COALESCE(SUM(total_sent), 0)::int AS total_sent,
      COALESCE(SUM(total_delivered), 0)::int AS total_delivered,
      COALESCE(SUM(total_failed), 0)::int AS total_failed,
      COALESCE(SUM(total_rejected), 0)::int AS total_rejected,
      COALESCE(SUM(credits_used), 0)::int AS credits_used,
      COALESCE(ROUND(AVG(recipient_count)), 0)::int AS avg_recipients
    FROM sms_campaigns
    WHERE user_id = ${session.userId}
      AND status = 'sent'
  `

  const sent = row?.total_sent ?? 0
  const delivered = row?.total_delivered ?? 0
  const failed = (row?.total_failed ?? 0) + (row?.total_rejected ?? 0)

  return {
    totalCampaigns: row?.total_campaigns ?? 0,
    totalSent: sent,
    totalDelivered: delivered,
    totalFailed: row?.total_failed ?? 0,
    totalRejected: row?.total_rejected ?? 0,
    deliveryRate: sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0,
    failureRate: sent > 0 ? Math.round((failed / sent) * 1000) / 10 : 0,
    creditsUsed: row?.credits_used ?? 0,
    avgRecipientsPerCampaign: row?.avg_recipients ?? 0,
  }
}

// ============================================================
// Overview — daily activity chart (last 30 days)
// ============================================================

export async function getDailyActivity(
  days: number = 30
): Promise<DailyActivityPoint[]> {
  const session = await getSession()
  if (!session) return []

  const rows = await sql`
    WITH date_series AS (
      SELECT generate_series(
        (NOW() - (${days} || ' days')::interval)::date,
        NOW()::date,
        '1 day'::interval
      )::date AS date
    )
    SELECT
      TO_CHAR(ds.date, 'YYYY-MM-DD') AS date,
      COALESCE(SUM(c.total_sent), 0)::int AS sent,
      COALESCE(SUM(c.total_delivered), 0)::int AS delivered,
      COALESCE(SUM(c.total_failed + c.total_rejected), 0)::int AS failed
    FROM date_series ds
    LEFT JOIN sms_campaigns c
      ON DATE_TRUNC('day', COALESCE(c.sent_at, c.created_at))::date = ds.date
      AND c.user_id = ${session.userId}
      AND c.status = 'sent'
    GROUP BY ds.date
    ORDER BY ds.date ASC
  `

  return rows as DailyActivityPoint[]
}

// ============================================================
// Overview — top sender IDs
// ============================================================

export async function getTopSenderIds(limit: number = 5): Promise<TopSenderId[]> {
  const session = await getSession()
  if (!session) return []

  const rows = await sql`
    SELECT
      sender_id,
      COUNT(*)::int AS campaigns,
      COALESCE(SUM(total_sent), 0)::int AS sent
    FROM sms_campaigns
    WHERE user_id = ${session.userId}
      AND status = 'sent'
      AND sender_id IS NOT NULL
      AND sender_id != ''
    GROUP BY sender_id
    ORDER BY sent DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    senderId: r.sender_id,
    campaigns: r.campaigns,
    sent: r.sent,
  }))
}

// ============================================================
// Overview — recent campaigns
// ============================================================

export async function getRecentCampaigns(
  limit: number = 5
): Promise<RecentCampaign[]> {
  const session = await getSession()
  if (!session) return []

  const rows = await sql`
    SELECT
      id, campaign_id, sender_id, message, recipient_count,
      total_sent, total_delivered, status, created_at
    FROM sms_campaigns
    WHERE user_id = ${session.userId}
      AND status = 'sent'
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    id: r.id,
    campaignId: r.campaign_id,
    senderId: r.sender_id,
    message: r.message,
    recipientCount: r.recipient_count,
    totalSent: r.total_sent,
    totalDelivered: r.total_delivered,
    deliveryRate:
      r.total_sent > 0
        ? Math.round((r.total_delivered / r.total_sent) * 1000) / 10
        : 0,
    status: r.status,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  }))
}

// ============================================================
// Delivery — status breakdown
// ============================================================

export async function getDeliveryBreakdown(): Promise<DeliveryBreakdown> {
  const session = await getSession()
  const empty = { delivered: 0, submitted: 0, failed: 0, rejected: 0, pending: 0 }
  if (!session) return empty

  // Prefer per-message data if available
  const [msgRow] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE m.status = 'DELIVERED')::int AS delivered,
      COUNT(*) FILTER (WHERE m.status = 'SUBMITTED')::int AS submitted,
      COUNT(*) FILTER (WHERE m.status = 'FAILED')::int AS failed,
      COUNT(*) FILTER (WHERE m.status = 'REJECTED')::int AS rejected,
      COUNT(*) FILTER (WHERE m.status = 'PENDING')::int AS pending,
      COUNT(*)::int AS total
    FROM sms_messages m
    INNER JOIN sms_campaigns c ON c.id = m.campaign_id
    WHERE c.user_id = ${session.userId}
  `

  // If we have per-message data, use it
  if ((msgRow?.total ?? 0) > 0) {
    return {
      delivered: msgRow.delivered,
      submitted: msgRow.submitted,
      failed: msgRow.failed,
      rejected: msgRow.rejected,
      pending: msgRow.pending,
    }
  }

  // Fall back to campaign-level aggregates
  const [campRow] = await sql`
    SELECT
      COALESCE(SUM(total_delivered), 0)::int AS delivered,
      COALESCE(SUM(total_failed), 0)::int AS failed,
      COALESCE(SUM(total_rejected), 0)::int AS rejected
    FROM sms_campaigns
    WHERE user_id = ${session.userId} AND status = 'sent'
  `

  return {
    delivered: campRow?.delivered ?? 0,
    submitted: 0,
    failed: campRow?.failed ?? 0,
    rejected: campRow?.rejected ?? 0,
    pending: 0,
  }
}

// ============================================================
// Delivery — failed messages (for retry list)
// ============================================================

export async function getFailedMessages(limit = 20): Promise<FailedMessage[]> {
  const session = await getSession()
  if (!session) return []

  const rows = await sql`
    SELECT
      m.id,
      m.recipient,
      m.status,
      m.retries,
      m.created_at,
      c.campaign_id,
      c.sender_id AS campaign_sender_id
    FROM sms_messages m
    INNER JOIN sms_campaigns c ON c.id = m.campaign_id
    WHERE c.user_id = ${session.userId}
      AND m.status IN ('FAILED', 'REJECTED')
    ORDER BY m.created_at DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    id: r.id,
    recipient: r.recipient,
    status: r.status,
    retries: r.retries,
    campaignId: r.campaign_id,
    campaignSenderId: r.campaign_sender_id,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  }))
}

// ============================================================
// Delivery — delivery rate over time
// ============================================================

export async function getDeliveryRateTrend(
  days: number = 30
): Promise<Array<{ date: string; rate: number; sent: number; delivered: number }>> {
  const session = await getSession()
  if (!session) return []

  const rows = await sql`
    WITH date_series AS (
      SELECT generate_series(
        (NOW() - (${days} || ' days')::interval)::date,
        NOW()::date,
        '1 day'::interval
      )::date AS date
    )
    SELECT
      TO_CHAR(ds.date, 'YYYY-MM-DD') AS date,
      COALESCE(SUM(c.total_sent), 0)::int AS sent,
      COALESCE(SUM(c.total_delivered), 0)::int AS delivered
    FROM date_series ds
    LEFT JOIN sms_campaigns c
      ON DATE_TRUNC('day', COALESCE(c.sent_at, c.created_at))::date = ds.date
      AND c.user_id = ${session.userId}
      AND c.status = 'sent'
    GROUP BY ds.date
    ORDER BY ds.date ASC
  `

  return rows.map((r) => ({
    date: r.date,
    sent: r.sent,
    delivered: r.delivered,
    rate: r.sent > 0 ? Math.round((r.delivered / r.sent) * 1000) / 10 : 0,
  }))
}