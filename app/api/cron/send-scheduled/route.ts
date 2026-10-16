import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sms } from "@/lib/signalpulse-sms"
import { canUserSend } from "@/lib/red-flags"
import { createNotification } from "@/app/actions/notifications"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: Request) {
  // ---- Auth: only Vercel Cron can call this ----
  const authHeader = req.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // ---- Find campaigns due to send ----
    const due = await sql`
      SELECT
        id,
        user_id,
        campaign_id,
        sender_id,
        message,
        mode,
        recipient_count,
        recipients_json,
        credits_used
      FROM sms_campaigns
      WHERE status = 'scheduled'
        AND scheduled_at IS NOT NULL
        AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 20
    `

    if (due.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0, failed: 0 })
    }

    let sent = 0
    let failed = 0

    for (const campaign of due) {
      try {
        // ---- Atomic lock — prevents double-send from overlapping runs ----
        const [locked] = await sql`
          UPDATE sms_campaigns
          SET status = 'sending'
          WHERE id = ${campaign.id} AND status = 'scheduled'
          RETURNING id
        `
        if (!locked) continue

        // ---- Re-check user is still allowed to send ----
        const gate = await canUserSend(campaign.user_id, campaign.message)
        if (!gate.allowed) {
          await refundCredits(campaign.user_id, campaign.credits_used)
          await sql`
            UPDATE sms_campaigns
            SET status = 'failed', sent_at = NOW()
            WHERE id = ${campaign.id}
          `
          failed++
          continue
        }

        const recipients = Array.isArray(campaign.recipients_json)
          ? (campaign.recipients_json as string[])
          : []

        if (recipients.length === 0) {
          await refundCredits(campaign.user_id, campaign.credits_used)
          await sql`
            UPDATE sms_campaigns
            SET status = 'failed', sent_at = NOW()
            WHERE id = ${campaign.id}
          `
          failed++
          continue
        }

        // ---- Send via gateway ----
        const result = await sms.send({
          recipients,
          senderId: campaign.sender_id,
          message: campaign.message,
        })

        if (!result.success) {
          await refundCredits(campaign.user_id, campaign.credits_used)
          await sql`
            UPDATE sms_campaigns
            SET status = 'failed', sent_at = NOW()
            WHERE id = ${campaign.id}
          `
          failed++
          continue
        }

        // ---- Mark sent + save real gateway campaign ID ----
        await sql`
          UPDATE sms_campaigns
          SET
            status = 'sent',
            campaign_id = COALESCE(${result.campaignId}, campaign_id),
            total_sent = ${result.totalSent ?? 0},
            total_rejected = ${result.totalRejected ?? 0},
            sent_at = NOW()
          WHERE id = ${campaign.id}
        `

        // ---- Notify the user ----
        try {
          await createNotification({
            userId: campaign.user_id,
            type: "success",
            title: "Scheduled campaign sent",
            body: `${result.totalSent ?? 0} of ${recipients.length} messages accepted.`,
            link: `/dashboard/campaigns/${campaign.id}`,
          })
        } catch (err) {
          console.error("[cron/send-scheduled] notification failed:", err)
        }

        sent++
      } catch (err) {
        console.error(
          `[cron/send-scheduled] campaign ${campaign.id} failed:`,
          err
        )
        await refundCredits(campaign.user_id, campaign.credits_used)
        await sql`
          UPDATE sms_campaigns
          SET status = 'failed', sent_at = NOW()
          WHERE id = ${campaign.id}
        `
        failed++
      }
    }

    return NextResponse.json({
      processed: due.length,
      sent,
      failed,
    })
  } catch (error) {
    console.error("[cron/send-scheduled] fatal:", error)
    return NextResponse.json(
      { error: "Cron failed" },
      { status: 500 }
    )
  }
}

// ---- Refund credits when a scheduled campaign fails ----
async function refundCredits(userId: number, amount: number) {
  if (amount <= 0) return
  try {
    await sql`
      UPDATE user_wallets
      SET sms_credits = sms_credits + ${amount},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `
  } catch (err) {
    console.error(
      `[cron/send-scheduled] refund failed for user ${userId}:`,
      err
    )
  }
}