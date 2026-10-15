"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"

export type ScheduledCampaign = {
  id: number
  campaign_id: string
  user_id: number
  username: string
  company_name: string
  sender_id: string
  message: string
  recipient_count: number
  scheduled_at: string
  status: string
}

export type ScheduledStats = {
  totalScheduled: number
  next24Hours: number
  thisWeek: number
  uniqueUsers: number
}

export async function listScheduledCampaigns(): Promise<ScheduledCampaign[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      c.id, c.campaign_id, c.user_id,
      u.username, u.company_name,
      c.sender_id, c.message, c.recipient_count,
      c.scheduled_at, c.status
    FROM sms_campaigns c
    INNER JOIN users u ON c.user_id = u.id
    WHERE c.status = 'scheduled' AND c.scheduled_at IS NOT NULL
    ORDER BY c.scheduled_at ASC
    LIMIT 200
  `

  return rows.map((r) => ({
    ...r,
    scheduled_at:
      r.scheduled_at instanceof Date ? r.scheduled_at.toISOString() : String(r.scheduled_at),
  })) as ScheduledCampaign[]
}

export async function getScheduledStats(): Promise<ScheduledStats> {
  const session = await getAdminSession()
  const empty = { totalScheduled: 0, next24Hours: 0, thisWeek: 0, uniqueUsers: 0 }
  if (!session) return empty

  const [row] = await sql`
    SELECT
      COUNT(*)::int AS total_scheduled,
      COUNT(*) FILTER (
        WHERE scheduled_at >= NOW() AND scheduled_at <= NOW() + INTERVAL '24 hours'
      )::int AS next_24h,
      COUNT(*) FILTER (
        WHERE scheduled_at >= NOW() AND scheduled_at <= NOW() + INTERVAL '7 days'
      )::int AS this_week,
      COUNT(DISTINCT user_id)::int AS unique_users
    FROM sms_campaigns
    WHERE status = 'scheduled' AND scheduled_at IS NOT NULL
  `

  return {
    totalScheduled: row?.total_scheduled ?? 0,
    next24Hours: row?.next_24h ?? 0,
    thisWeek: row?.this_week ?? 0,
    uniqueUsers: row?.unique_users ?? 0,
  }
}