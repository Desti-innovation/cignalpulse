"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { sms } from "@/lib/signalpulse-sms"
import { revalidatePath } from "next/cache"

// ---------- Types ----------

export type AdminCampaignRow = {
  id: number
  campaign_id: string
  user_id: number
  username: string
  company_name: string
  sender_id: string
  message: string
  recipient_count: number
  total_sent: number
  total_delivered: number
  total_failed: number
  total_rejected: number
  credits_used: number
  status: string
  sent_at: string | null
  scheduled_at: string | null
  created_at: string
}

export type CampaignStats = {
  totalCampaigns: number
  totalSent: number
  totalDelivered: number
  totalFailed: number
  deliveryRate: number
  creditsUsed: number
}

// ---------- Read: list all campaigns ----------

export async function listCampaigns(): Promise<AdminCampaignRow[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      c.id,
      c.campaign_id,
      c.user_id,
      u.username,
      u.company_name,
      c.sender_id,
      c.message,
      c.recipient_count,
      c.total_sent,
      c.total_delivered,
      c.total_failed,
      c.total_rejected,
      c.credits_used,
      c.status,
      c.sent_at,
      c.scheduled_at,
      c.created_at
    FROM sms_campaigns c
    INNER JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
    LIMIT 500
  `

  return rows as AdminCampaignRow[]
}

// ---------- Read: global campaign stats ----------

export async function getCampaignStats(): Promise<CampaignStats> {
  const session = await getAdminSession()
  if (!session) {
    return {
      totalCampaigns: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      deliveryRate: 0,
      creditsUsed: 0,
    }
  }

  const rows = await sql`
    SELECT 
      COUNT(*)::int AS total_campaigns,
      COALESCE(SUM(total_sent), 0)::int AS total_sent,
      COALESCE(SUM(total_delivered), 0)::int AS total_delivered,
      COALESCE(SUM(total_failed), 0)::int AS total_failed,
      COALESCE(SUM(credits_used), 0)::int AS credits_used
    FROM sms_campaigns
  `

  const r = rows[0]
  const deliveryRate =
    r.total_sent > 0 ? Math.round((r.total_delivered / r.total_sent) * 1000) / 10 : 0

  return {
    totalCampaigns: r.total_campaigns,
    totalSent: r.total_sent,
    totalDelivered: r.total_delivered,
    totalFailed: r.total_failed,
    deliveryRate,
    creditsUsed: r.credits_used,
  }
}

// ---------- Read: daily activity for analytics chart (last 30 days) ----------

export async function getDailyActivity(): Promise<
  Array<{ date: string; sent: number; delivered: number; failed: number }>
> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('day', COALESCE(sent_at, created_at)), 'YYYY-MM-DD') AS date,
      COALESCE(SUM(total_sent), 0)::int AS sent,
      COALESCE(SUM(total_delivered), 0)::int AS delivered,
      COALESCE(SUM(total_failed), 0)::int AS failed
    FROM sms_campaigns
    WHERE COALESCE(sent_at, created_at) >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', COALESCE(sent_at, created_at))
    ORDER BY date ASC
  `

  return rows as Array<{ date: string; sent: number; delivered: number; failed: number }>
}

// ---------- Read: top senders (users with most campaigns) ----------

export async function getTopSenders(): Promise<
  Array<{ user_id: number; company_name: string; username: string; campaigns: number; sent: number }>
> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      u.id AS user_id,
      u.company_name,
      u.username,
      COUNT(c.id)::int AS campaigns,
      COALESCE(SUM(c.total_sent), 0)::int AS sent
    FROM users u
    INNER JOIN sms_campaigns c ON c.user_id = u.id
    GROUP BY u.id, u.company_name, u.username
    ORDER BY sent DESC
    LIMIT 5
  `

  return rows as Array<{
    user_id: number
    company_name: string
    username: string
    campaigns: number
    sent: number
  }>
}

// ---------- Action: sync delivery report from gateway ----------

export async function syncCampaignAction(campaignDbId: number): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated as admin." }

  const [campaign] = await sql`
    SELECT id, campaign_id FROM sms_campaigns WHERE id = ${campaignDbId} LIMIT 1
  `
  if (!campaign) return { success: false, error: "Campaign not found." }

  const report = await sms.getCampaignReport(campaign.campaign_id)

  if (report.length === 0) {
    return { success: false, error: "No report data available from the gateway." }
  }

  let delivered = 0
  let failed = 0

  for (const entry of report) {
    let mappedStatus = "PENDING"
    if (entry.status === "DELIVERED") {
      mappedStatus = "DELIVERED"
      delivered++
    } else if (entry.status === "FAILED" || entry.status === "REJECTED") {
      mappedStatus = "FAILED"
      failed++
    } else if (entry.status === "SUBMITTED") {
      mappedStatus = "SUBMITTED"
    }

    await sql`
      INSERT INTO sms_messages (campaign_id, message_id, recipient, status, retries, delivered_at)
      VALUES (
        ${campaign.id},
        ${entry.messageId},
        ${entry.recipient},
        ${mappedStatus},
        ${entry.retries},
        ${mappedStatus === "DELIVERED" ? new Date() : null}
      )
      ON CONFLICT DO NOTHING
    `
  }

  await sql`
    UPDATE sms_campaigns
    SET 
      total_delivered = ${delivered},
      total_failed = ${failed}
    WHERE id = ${campaign.id}
  `

  revalidatePath("/admin/campaigns")
  revalidatePath("/admin/analytics")

  return {
    success: true,
    message: `Synced. Delivered: ${delivered}, Failed: ${failed}.`,
  }
}