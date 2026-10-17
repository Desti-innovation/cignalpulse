"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sms } from "@/lib/signalpulse-sms"
import { canUserSend } from "@/lib/red-flags"
import { calculateSmsParts } from "@/lib/sms-parts"
import { rateLimit, RateLimits } from "@/lib/rate-limit"
import {
  validateSenderId,
  validateMessage,
  validateRecipientArray,
} from "@/lib/validation"
import { revalidatePath } from "next/cache"
import { decryptPhone } from "@/lib/phone-crypto" // 👈 Added decryption import

// ============================================================
// Types
// ============================================================

export type SendSmsInput = {
  mode: "individual" | "bulk" | "group"
  senderId: string
  message: string
  recipients: string[]
  scheduledAt?: string | null
}

export type SendSmsResult = {
  success: boolean
  error?: string
  campaignDbId?: number
  campaignId?: string
  totalSent?: number
  totalRejected?: number
  creditsUsed?: number
  isScheduled?: boolean
}

export type CreditBatchInfo = {
  id: number
  bundle_name: string | null
  credits_remaining: number
  expires_at: string | null
}

export type UserSendContext = {
  sendingStatus: "active" | "flagged" | "suspended"
  smsCredits: number
  approvedSenderIds: string[]
  batches: CreditBatchInfo[]
}

export type CampaignDetail = {
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
  recipients: string[]
}

export type CampaignMessage = {
  id: number
  recipient: string
  status: string
  retries: number
  deliveredAt: string | null
  createdAt: string
  lastRetryAt: string | null
}

// ============================================================
// Read — the context the send page needs
// ============================================================

export async function getUserSendContext(): Promise<UserSendContext | null> {
  const session = await getSession()
  if (!session) return null

  const [user] = await sql`
    SELECT sending_status, email FROM users WHERE id = ${session.userId} LIMIT 1
  `
  if (!user) return null

  const [wallet] = await sql`
    SELECT sms_credits FROM user_wallets WHERE user_id = ${session.userId} LIMIT 1
  `

  const senderRequests = await sql`
    SELECT sender_id
    FROM sender_id_requests
    WHERE email = ${user.email}
      AND status = 'approved'
  `

  const batchRows = await sql`
    SELECT id, bundle_name, credits_remaining, expires_at
    FROM user_credit_batches
    WHERE user_id = ${session.userId} AND credits_remaining > 0
    ORDER BY 
      CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END ASC,
      expires_at ASC,
      purchased_at ASC
  `

  return {
    sendingStatus: (user.sending_status ?? "active") as
      | "active"
      | "flagged"
      | "suspended",
    smsCredits: wallet?.sms_credits ?? 0,
    approvedSenderIds: senderRequests.map((r) => r.sender_id),
    batches: batchRows.map((b) => ({
      id: b.id,
      bundle_name: b.bundle_name,
      credits_remaining: b.credits_remaining,
      expires_at:
        b.expires_at instanceof Date
          ? b.expires_at.toISOString()
          : b.expires_at
          ? String(b.expires_at)
          : null,
    })),
  }
}

// ============================================================
// Main action — send SMS
// ============================================================

export async function sendSmsAction(
  input: SendSmsInput
): Promise<SendSmsResult> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const { limit, windowMs } = RateLimits.sendSms
  const rateCheck = rateLimit(`send:${session.userId}`, limit, windowMs)

  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `You're sending too many campaigns. Please try again in ${
        rateCheck.retryAfterSeconds ?? 60
      } seconds.`,
    }
  }

  // ---- Input validation ----
  const senderCheck = validateSenderId(input.senderId)
  if (!senderCheck.valid) {
    return { success: false, error: senderCheck.error }
  }

  const messageCheck = validateMessage(input.message)
  if (!messageCheck.valid) {
    return { success: false, error: messageCheck.error }
  }

  const recipientsCheck = validateRecipientArray(input.recipients, {
    min: 1,
    max: 10000,
  })
  if (!recipientsCheck.valid || !recipientsCheck.value) {
    return { success: false, error: recipientsCheck.error }
  }

  const recipients = recipientsCheck.value
  const message = input.message.trim()
  const senderId = input.senderId.trim()

  // ---- Verify sender ID is one of the user's approved IDs ----
  const [userRow] = await sql`
    SELECT email FROM users WHERE id = ${session.userId} LIMIT 1
  `
  if (!userRow) {
    return { success: false, error: "User not found." }
  }

  const approvedRows = await sql`
    SELECT sender_id
    FROM sender_id_requests
    WHERE email = ${userRow.email}
      AND status = 'approved'
  `
  const approvedIds = approvedRows.map((r) => r.sender_id)

  if (!approvedIds.includes(senderId)) {
    return {
      success: false,
      error: `"${senderId}" is not an approved sender ID for this account. Approved: ${
        approvedIds.length > 0 ? approvedIds.join(", ") : "none"
      }`,
    }
  }

  // ---- Sync gate ----
  const gate = await canUserSend(session.userId, message)
  if (!gate.allowed) {
    return { success: false, error: gate.reason || "Sending blocked." }
  }

  // ---- Compute cost ----
  const partsInfo = calculateSmsParts(message)
  const totalCreditsNeeded = recipients.length * partsInfo.parts

  // ---- Check wallet balance ----
  const [wallet] = await sql`
    SELECT sms_credits FROM user_wallets WHERE user_id = ${session.userId} LIMIT 1
  `

  if (!wallet || wallet.sms_credits < totalCreditsNeeded) {
    return {
      success: false,
      error: `Insufficient credits. Need ${totalCreditsNeeded.toLocaleString()}, have ${(
        wallet?.sms_credits ?? 0
      ).toLocaleString()}.`,
    }
  }

  // ---- Determine if scheduled ----
  const isScheduled =
    !!input.scheduledAt && new Date(input.scheduledAt) > new Date()

  if (isScheduled && input.scheduledAt) {
    const scheduledDate = new Date(input.scheduledAt)
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    if (scheduledDate > oneYearFromNow) {
      return {
        success: false,
        error: "Scheduled date cannot be more than 1 year in the future.",
      }
    }
  }

  // ============================================================
  // STEP 1 — Deduct credits FIRST
  // ============================================================
  try {
    await deductCreditsFromBatches(session.userId, totalCreditsNeeded)
  } catch (err) {
    console.error("[send-sms] credit deduction failed:", err)
    return {
      success: false,
      error: "Failed to reserve credits. Please try again.",
    }
  }

  let creditsReserved = true

  const refund = async (reason: string) => {
    if (!creditsReserved) return
    try {
      await refundCreditsToWallet(session.userId, totalCreditsNeeded)
      creditsReserved = false
      console.log(
        `[send-sms] refunded ${totalCreditsNeeded} credits to user ${session.userId} — reason: ${reason}`
      )
    } catch (err) {
      console.error(
        `[send-sms] CRITICAL: refund failed for user ${session.userId} — ${totalCreditsNeeded} credits lost. Reason: ${reason}`,
        err
      )
    }
  }

  // ============================================================
  // STEP 2 — Send (or schedule) and record the campaign
  // ============================================================
  try {
    let gatewayResult: {
      success: boolean
      campaignId?: string
      totalSent?: number
      totalRejected?: number
      creditsUsed?: number
    } = { success: true, campaignId: `PENDING-${Date.now()}`, totalSent: 0 }

    if (!isScheduled) {
      const result = await sms.send({
        recipients,
        senderId,
        message,
      })

      if (!result.success) {
        await refund(`gateway error: ${result.error || "unknown"}`)
        return {
          success: false,
          error: result.error || "Send failed.",
        }
      }

      gatewayResult = {
        success: true,
        campaignId: result.campaignId,
        totalSent: result.totalSent,
        totalRejected: result.totalRejected,
        creditsUsed: result.creditsUsed,
      }
    }

    // ---- Insert campaign row ----
    const [campaign] = await sql`
      INSERT INTO sms_campaigns (
        user_id, campaign_id, sender_id, message, mode,
        recipient_count, total_sent, total_rejected,
        credits_used, status, sent_at, scheduled_at, recipients_json
      ) VALUES (
        ${session.userId},
        ${gatewayResult.campaignId ?? `PENDING-${Date.now()}`},
        ${senderId},
        ${message},
        ${input.mode},
        ${recipients.length},
        ${gatewayResult.totalSent ?? 0},
        ${gatewayResult.totalRejected ?? 0},
        ${totalCreditsNeeded},
        ${isScheduled ? "scheduled" : "sent"},
        ${isScheduled ? null : new Date().toISOString()},
        ${input.scheduledAt || null},
        ${JSON.stringify(recipients)}::jsonb
      )
      RETURNING id
    `

    creditsReserved = false

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/wallet")
    revalidatePath("/dashboard/campaigns")
    if (isScheduled) {
      revalidatePath("/dashboard/campaigns/scheduled")
    }

    return {
      success: true,
      campaignDbId: campaign.id,
      campaignId: gatewayResult.campaignId,
      totalSent: gatewayResult.totalSent,
      totalRejected: gatewayResult.totalRejected,
      creditsUsed: totalCreditsNeeded,
      isScheduled,
    }
  } catch (error) {
    console.error("[send-sms] Failed:", error)
    await refund("post-deduction failure")

    return {
      success: false,
      error: error instanceof Error ? error.message : "Send failed.",
    }
  }
}

// ============================================================
// Helper — FIFO deduct credits from oldest expiring batch first
// ============================================================

async function deductCreditsFromBatches(
  userId: number,
  amount: number
): Promise<void> {
  await sql`
    UPDATE user_wallets
    SET sms_credits = GREATEST(sms_credits - ${amount}, 0),
        updated_at = NOW()
    WHERE user_id = ${userId}
  `

  let remaining = amount

  const batches = await sql`
    SELECT id, credits_remaining
    FROM user_credit_batches
    WHERE user_id = ${userId} AND credits_remaining > 0
    ORDER BY 
      CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END ASC,
      expires_at ASC,
      purchased_at ASC
  `

  for (const batch of batches) {
    if (remaining <= 0) break
    const deduct = Math.min(batch.credits_remaining, remaining)
    await sql`
      UPDATE user_credit_batches
      SET credits_remaining = credits_remaining - ${deduct}
      WHERE id = ${batch.id}
    `
    remaining -= deduct
  }
}

// ============================================================
// Helper — refund credits to the wallet
// ============================================================

async function refundCreditsToWallet(
  userId: number,
  amount: number
): Promise<void> {
  await sql`
    UPDATE user_wallets
    SET sms_credits = sms_credits + ${amount},
        updated_at = NOW()
    WHERE user_id = ${userId}
  `
}

// ============================================================
// Read — Campaign detail page
// ============================================================

export async function getCampaignDetail(
  campaignDbId: number
): Promise<CampaignDetail | null> {
  const session = await getSession()
  if (!session) return null

  if (!Number.isInteger(campaignDbId) || campaignDbId <= 0) return null

  const [row] = await sql`
    SELECT 
      id, campaign_id, sender_id, message, mode,
      recipient_count, total_sent, total_delivered, total_failed, total_rejected,
      credits_used, status, scheduled_at, sent_at, created_at, recipients_json
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
    campaignId: row.campaign_id,
    senderId: row.sender_id,
    message: row.message,
    mode: row.mode ?? "bulk",
    recipientCount: row.recipient_count,
    totalSent: row.total_sent,
    totalDelivered: row.total_delivered,
    totalFailed: row.total_failed,
    totalRejected: row.total_rejected,
    creditsUsed: row.credits_used,
    status: row.status,
    scheduledAt: row.scheduled_at
      ? row.scheduled_at instanceof Date
        ? row.scheduled_at.toISOString()
        : String(row.scheduled_at)
      : null,
    sentAt: row.sent_at
      ? row.sent_at instanceof Date
        ? row.sent_at.toISOString()
        : String(row.sent_at)
      : null,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    recipients,
  }
}

export async function getCampaignMessages(
  campaignDbId: number,
  limit = 100
): Promise<CampaignMessage[]> {
  const session = await getSession()
  if (!session) return []

  if (!Number.isInteger(campaignDbId) || campaignDbId <= 0) return []

  const safeLimit = Math.min(Math.max(limit, 1), 500)

  const rows = await sql`
    SELECT 
      m.id, m.recipient, m.status, m.retries,
      m.delivered_at, m.created_at, m.last_retry_at
    FROM sms_messages m
    INNER JOIN sms_campaigns c ON m.campaign_id = c.id
    WHERE c.id = ${campaignDbId} AND c.user_id = ${session.userId}
    ORDER BY m.created_at DESC
    LIMIT ${safeLimit}
  `

  return rows.map((m) => ({
    id: m.id,
    recipient: m.recipient,
    status: m.status,
    retries: m.retries,
    deliveredAt: m.delivered_at
      ? m.delivered_at instanceof Date
        ? m.delivered_at.toISOString()
        : String(m.delivered_at)
      : null,
    createdAt:
      m.created_at instanceof Date
        ? m.created_at.toISOString()
        : String(m.created_at),
    lastRetryAt: m.last_retry_at
      ? m.last_retry_at instanceof Date
        ? m.last_retry_at.toISOString()
        : String(m.last_retry_at)
      : null,
  }))
}

// ============================================================
// Read — groups the user can send to
// ============================================================

export type SendGroupOption = {
  id: number
  name: string
  description: string | null
  contactCount: number
  activeCount: number
}

export async function getGroupsForSend(): Promise<SendGroupOption[]> {
  const session = await getSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      g.id,
      g.name,
      g.description,
      COUNT(m.contact_id)::int AS contact_count,
      COUNT(m.contact_id) FILTER (WHERE c.is_active = true)::int AS active_count
    FROM contact_groups g
    LEFT JOIN contact_group_members m ON m.group_id = g.id
    LEFT JOIN contacts c ON c.id = m.contact_id
    WHERE g.user_id = ${session.userId}
    GROUP BY g.id, g.name, g.description
    ORDER BY g.name ASC
  `

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    contactCount: r.contact_count,
    activeCount: r.active_count,
  }))
}

// ============================================================
// Read — resolve a list of group IDs into unique active phones
// ============================================================

export async function resolveGroupRecipients(
  groupIds: number[]
): Promise<string[]> {
  const session = await getSession()
  if (!session) return []

  if (!Array.isArray(groupIds) || groupIds.length === 0) return []

  const safeIds = groupIds
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 100)

  if (safeIds.length === 0) return []

  // 👈 UPDATE: Query the encrypted column, not the old plaintext one
  const rows = await sql`
    SELECT DISTINCT c.phone_encrypted
    FROM contacts c
    INNER JOIN contact_group_members m ON m.contact_id = c.id
    WHERE m.group_id = ANY(${safeIds}::int[])
      AND c.user_id = ${session.userId}
      AND c.is_active = true
    ORDER BY c.phone_encrypted
  `

  // 👈 UPDATE: Decrypt the numbers in memory before sending them to the gateway
  return rows.map((r) => decryptPhone(r.phone_encrypted)).filter(Boolean)
}

// ============================================================
// Action — save the current send form as a draft campaign
// ============================================================

export type SaveDraftInput = {
  mode: "individual" | "bulk" | "group"
  senderId: string
  message: string
  recipients: string[]
}

export type SaveDraftResult = {
  success: boolean
  error?: string
  campaignDbId?: number
}

export async function saveDraftAction(
  input: SaveDraftInput
): Promise<SaveDraftResult> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const { limit, windowMs } = RateLimits.sendSms
  const rateCheck = rateLimit(`draft:${session.userId}`, limit, windowMs)

  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Too many saves. Please try again in ${
        rateCheck.retryAfterSeconds ?? 60
      } seconds.`,
    }
  }

  const hasContent =
    (input.senderId?.trim() ?? "").length > 0 ||
    (input.message?.trim() ?? "").length > 0 ||
    (input.recipients?.length ?? 0) > 0

  if (!hasContent) {
    return {
      success: false,
      error: "Nothing to save. Fill in at least one field.",
    }
  }

  const senderId = (input.senderId ?? "").trim().slice(0, 11)
  const message = (input.message ?? "").trim().slice(0, 1000)
  const recipients = Array.isArray(input.recipients)
    ? input.recipients.slice(0, 10000)
    : []

  try {
    const campaignId = `DRAFT-${session.userId}-${Date.now()}`

    const [campaign] = await sql`
      INSERT INTO sms_campaigns (
        user_id,
        campaign_id,
        sender_id,
        message,
        mode,
        recipient_count,
        total_sent,
        total_rejected,
        credits_used,
        status,
        recipients_json
      ) VALUES (
        ${session.userId},
        ${campaignId},
        ${senderId},
        ${message},
        ${input.mode},
        ${recipients.length},
        0,
        0,
        0,
        'draft',
        ${JSON.stringify(recipients)}::jsonb
      )
      RETURNING id
    `

    revalidatePath("/dashboard/campaigns")
    revalidatePath("/dashboard/campaigns/drafts")
    revalidatePath("/dashboard/send")

    return {
      success: true,
      campaignDbId: campaign.id,
    }
  } catch (error) {
    console.error("[save-draft] Failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save draft.",
    }
  }
}