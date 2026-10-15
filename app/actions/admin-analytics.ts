"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"

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
  averageRecipientsPerCampaign: number
  activeSenders: number
  activeUsers: number
}

export type DailyActivityPoint = {
  date: string
  sent: number
  delivered: number
  failed: number
}

export type WeeklyActivityPoint = {
  weekStart: string
  sent: number
  delivered: number
}

export type TopSender = {
  userId: number
  companyName: string
  username: string
  campaigns: number
  sent: number
  delivered: number
  deliveryRate: number
}

export type TopSenderId = {
  senderId: string
  campaigns: number
  sent: number
}

export type StatusBreakdown = {
  status: string
  count: number
  percentage: number
}

// ============================================================
// Read: overview stats
// ============================================================

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const session = await getAdminSession()
  const empty: AnalyticsOverview = {
    totalCampaigns: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalRejected: 0,
    deliveryRate: 0,
    failureRate: 0,
    creditsUsed: 0,
    averageRecipientsPerCampaign: 0,
    activeSenders: 0,
    activeUsers: 0,
  }
  if (!session) return empty

  const [campaignRow] = await sql`
    SELECT 
      COUNT(*)::int AS total_campaigns,
      COALESCE(SUM(total_sent), 0)::int AS total_sent,
      COALESCE(SUM(total_delivered), 0)::int AS total_delivered,
      COALESCE(SUM(total_failed), 0)::int AS total_failed,
      COALESCE(SUM(total_rejected), 0)::int AS total_rejected,
      COALESCE(SUM(credits_used), 0)::int AS credits_used,
      COALESCE(ROUND(AVG(recipient_count)), 0)::int AS avg_recipients
    FROM sms_campaigns
  `

  const [senderRow] = await sql`
    SELECT COUNT(DISTINCT sender_id)::int AS active_senders
    FROM sms_campaigns
  `

  const [userRow] = await sql`
    SELECT COUNT(*)::int AS active_users
    FROM users
    WHERE is_active = true
  `

  const sent = campaignRow.total_sent
  const delivered = campaignRow.total_delivered
  const failed = campaignRow.total_failed

  return {
    totalCampaigns: campaignRow.total_campaigns,
    totalSent: sent,
    totalDelivered: delivered,
    totalFailed: failed,
    totalRejected: campaignRow.total_rejected,
    deliveryRate: sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0,
    failureRate: sent > 0 ? Math.round((failed / sent) * 1000) / 10 : 0,
    creditsUsed: campaignRow.credits_used,
    averageRecipientsPerCampaign: campaignRow.avg_recipients,
    activeSenders: senderRow.active_senders,
    activeUsers: userRow.active_users,
  }
}

// ============================================================
// Read: daily activity (last N days)
// ============================================================

export async function getDailyActivity(days: number = 30): Promise<DailyActivityPoint[]> {
  const session = await getAdminSession()
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
      COALESCE(SUM(c.total_failed), 0)::int AS failed
    FROM date_series ds
    LEFT JOIN sms_campaigns c 
      ON DATE_TRUNC('day', COALESCE(c.sent_at, c.created_at))::date = ds.date
    GROUP BY ds.date
    ORDER BY ds.date ASC
  `

  return rows as DailyActivityPoint[]
}

// ============================================================
// Read: weekly activity (last 12 weeks)
// ============================================================

export async function getWeeklyActivity(weeks: number = 12): Promise<WeeklyActivityPoint[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('week', COALESCE(sent_at, created_at)), 'YYYY-MM-DD') AS week_start,
      COALESCE(SUM(total_sent), 0)::int AS sent,
      COALESCE(SUM(total_delivered), 0)::int AS delivered
    FROM sms_campaigns
    WHERE COALESCE(sent_at, created_at) >= NOW() - (${weeks} || ' weeks')::interval
    GROUP BY DATE_TRUNC('week', COALESCE(sent_at, created_at))
    ORDER BY week_start ASC
  `

  return rows as WeeklyActivityPoint[]
}

// ============================================================
// Read: top senders (customers)
// ============================================================

export async function getTopSenders(limit: number = 5): Promise<TopSender[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      u.id AS user_id,
      COALESCE(u.display_name, u.company_name) AS company_name,
      u.username,
      COUNT(c.id)::int AS campaigns,
      COALESCE(SUM(c.total_sent), 0)::int AS sent,
      COALESCE(SUM(c.total_delivered), 0)::int AS delivered
    FROM users u
    INNER JOIN sms_campaigns c ON c.user_id = u.id
    GROUP BY u.id, u.display_name, u.company_name, u.username
    ORDER BY sent DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    userId: r.user_id,
    companyName: r.company_name,
    username: r.username,
    campaigns: r.campaigns,
    sent: r.sent,
    delivered: r.delivered,
    deliveryRate: r.sent > 0 ? Math.round((r.delivered / r.sent) * 1000) / 10 : 0,
  }))
}

// ============================================================
// Read: top sender IDs
// ============================================================

export async function getTopSenderIds(limit: number = 5): Promise<TopSenderId[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      sender_id,
      COUNT(*)::int AS campaigns,
      COALESCE(SUM(total_sent), 0)::int AS sent
    FROM sms_campaigns
    GROUP BY sender_id
    ORDER BY sent DESC
    LIMIT ${limit}
  `

  return rows as TopSenderId[]
}

// ============================================================
// Read: campaign status breakdown
// ============================================================

export async function getStatusBreakdown(): Promise<StatusBreakdown[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      status,
      COUNT(*)::int AS count
    FROM sms_campaigns
    GROUP BY status
    ORDER BY count DESC
  `

  const total = rows.reduce((sum, r) => sum + r.count, 0)

  return rows.map((r) => ({
    status: r.status,
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0,
  }))
}