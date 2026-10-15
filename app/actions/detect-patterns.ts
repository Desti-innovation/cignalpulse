"use server"

import { sql } from "@/lib/db"
import { flagUser } from "@/lib/red-flags"

/**
 * Runs detection rules for a single user.
 * Called by a cron endpoint (or admin button) periodically.
 */
export async function detectUserPatterns(userId: number): Promise<{
  flagged: boolean
  reasons: string[]
}> {
  const reasons: string[] = []

  // Rule 1: Low delivery rate over last 100 messages
  const [delivery] = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE m.status = 'DELIVERED')::int AS delivered,
      COUNT(*)::int AS total
    FROM sms_messages m
    INNER JOIN sms_campaigns c ON m.campaign_id = c.id
    WHERE c.user_id = ${userId}
      AND m.created_at >= NOW() - INTERVAL '7 days'
  `

  if (delivery.total >= 50) {
    const rate = (delivery.delivered / delivery.total) * 100
    if (rate < 30) {
      reasons.push("very_low_delivery")
      await flagUser({
        userId,
        reason: "very_low_delivery",
        severity: "high",
        details: { deliveryRate: rate, sampleSize: delivery.total },
        triggeredBy: "auto",
      })
    } else if (rate < 60) {
      reasons.push("low_delivery_rate")
      await flagUser({
        userId,
        reason: "low_delivery_rate",
        severity: "medium",
        details: { deliveryRate: rate, sampleSize: delivery.total },
        triggeredBy: "auto",
      })
    }
  }

  // Rule 2: Rapid campaigns (more than 10 in the last hour)
  const [rapid] = await sql`
    SELECT COUNT(*)::int AS count
    FROM sms_campaigns
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '1 hour'
  `

  if (rapid.count > 10) {
    reasons.push("rapid_campaigns")
    await flagUser({
      userId,
      reason: "rapid_campaigns",
      severity: "medium",
      details: { campaignsInLastHour: rapid.count },
      triggeredBy: "auto",
    })
  }

  // Rule 3: High failure rate
  const [failure] = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE total_failed > 0)::int AS failed_campaigns,
      COUNT(*)::int AS total
    FROM sms_campaigns
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '24 hours'
  `

  if (failure.total >= 5 && failure.failed_campaigns / failure.total > 0.5) {
    reasons.push("high_failure_rate")
    await flagUser({
      userId,
      reason: "high_failure_rate",
      severity: "medium",
      details: { failedCampaigns: failure.failed_campaigns, total: failure.total },
      triggeredBy: "auto",
    })
  }

  return { flagged: reasons.length > 0, reasons }
}