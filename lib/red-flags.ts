import "server-only"
import { sql } from "@/lib/db"
import { sms } from "@/lib/signalpulse-sms"

// ============================================================
// Types
// ============================================================

export type RedFlagReason =
  | "spam_keywords"
  | "low_delivery_rate"
  | "very_low_delivery"
  | "high_opt_out_rate"
  | "rapid_campaigns"
  | "high_failure_rate"
  | "manual_flag"

export type RedFlagSeverity = "low" | "medium" | "high"

export type FlagUserOptions = {
  userId: number
  reason: RedFlagReason
  severity: RedFlagSeverity
  details?: Record<string, unknown>
  triggeredBy?: "auto" | "admin"
  adminId?: number
}

// ============================================================
// Sync gate — runs before every send
// ============================================================

/**
 * Checks if a user can send. Returns null if they can,
 * or a reason string if they're blocked.
 */
export async function canUserSend(
  userId: number,
  message: string
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Check user's current sending status
  const [user] = await sql`
    SELECT sending_status, email, company_name
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `

  if (!user) return { allowed: false, reason: "User not found." }

  if (user.sending_status === "flagged") {
    return {
      allowed: false,
      reason: "Your account has been flagged for review. Please contact support.",
    }
  }

  if (user.sending_status === "suspended") {
    return {
      allowed: false,
      reason: "Your account is suspended. Please contact support.",
    }
  }

  // 2. Check message for spam keywords
  const keywordCheck = await checkSpamKeywords(message)
  if (keywordCheck.matched) {
    // Auto-flag the user
    await flagUser({
      userId,
      reason: "spam_keywords",
      severity: keywordCheck.severity,
      details: { matchedKeywords: keywordCheck.matches, messagePreview: message.slice(0, 200) },
      triggeredBy: "auto",
    })

    // Notify user (email + SMS)
    await notifyFlaggedUser({
      userId,
      reasonLabel: "unusual activity detected",
    })

    return {
      allowed: false,
      reason: "Your message contains content that violates our policy. Your account is under review.",
    }
  }

  return { allowed: true }
}

// ============================================================
// Keyword detection
// ============================================================

async function checkSpamKeywords(message: string): Promise<{
  matched: boolean
  matches: string[]
  severity: RedFlagSeverity
}> {
  const keywords = await sql`
    SELECT keyword, severity FROM spam_keywords WHERE is_active = true
  `

  const lower = message.toLowerCase()
  const matches: string[] = []
  let maxSeverity: RedFlagSeverity = "low"

  for (const k of keywords) {
    if (lower.includes(k.keyword.toLowerCase())) {
      matches.push(k.keyword)
      const sev = k.severity as RedFlagSeverity
      if (sev === "high") maxSeverity = "high"
      else if (sev === "medium" && maxSeverity !== "high") maxSeverity = "medium"
    }
  }

  return {
    matched: matches.length > 0,
    matches,
    severity: maxSeverity,
  }
}

// ============================================================
// Flag a user
// ============================================================

export async function flagUser(opts: FlagUserOptions): Promise<{ id: number }> {
  // 1. Update user status (unless already suspended)
  await sql`
    UPDATE users
    SET sending_status = 'flagged', updated_at = NOW()
    WHERE id = ${opts.userId} AND sending_status != 'suspended'
  `

  // 2. Insert red flag record
  const [flag] = await sql`
    INSERT INTO red_flags (user_id, reason, severity, details, triggered_by)
    VALUES (
      ${opts.userId},
      ${opts.reason},
      ${opts.severity},
      ${opts.details ? JSON.stringify(opts.details) : null}::jsonb,
      ${opts.triggeredBy ?? "auto"}
    )
    RETURNING id
  `

  return { id: flag.id }
}

// ============================================================
// Notify user (email + SMS from platform Sender ID)
// ============================================================

export async function notifyFlaggedUser(opts: {
  userId: number
  reasonLabel: string
}): Promise<void> {
  const [user] = await sql`
    SELECT email, phone, company_name, username
    FROM users
    WHERE id = ${opts.userId}
    LIMIT 1
  `

  if (!user) return

  const systemSenderId = process.env.SIGNALPULSE_SYSTEM_SENDER_ID
  if (!systemSenderId) {
    console.warn("[notifyFlaggedUser] SIGNALPULSE_SYSTEM_SENDER_ID not set")
    return
  }

  // SMS body
  const smsBody = `Hi ${user.company_name}, we've paused sending on your CignalPulse account after detecting ${opts.reasonLabel}. Contact support@cignalpulse.com to restore access.`

  // Send SMS using platform Sender ID
  try {
    const result = await sms.send({
      recipients: [user.phone],
      senderId: systemSenderId,
      message: smsBody,
    })

    await sql`
      INSERT INTO notification_log (user_id, channel, subject, body, destination, status)
      VALUES (
        ${opts.userId},
        'sms',
        ${"Account under review"},
        ${smsBody},
        ${user.phone},
        ${result.success ? "sent" : "failed"}
      )
    `
  } catch (error) {
    console.error("[notifyFlaggedUser] SMS send failed:", error)
    await sql`
      INSERT INTO notification_log (user_id, channel, subject, body, destination, status, error)
      VALUES (
        ${opts.userId},
        'sms',
        ${"Account under review"},
        ${smsBody},
        ${user.phone},
        'failed',
        ${error instanceof Error ? error.message : "unknown"}
      )
    `
  }

  // Log email intent (actual email sending handled by your email service when ready)
  await sql`
    INSERT INTO notification_log (user_id, channel, subject, body, destination, status)
    VALUES (
      ${opts.userId},
      'email',
      ${"Your CignalPulse account is under review"},
      ${"We've detected unusual activity on your account. Sending is paused. Contact support@cignalpulse.com."},
      ${user.email},
      'pending'
    )
  `
}

// ============================================================
// Clear a flag (admin action)
// ============================================================

export async function clearFlag(opts: {
  flagId: number
  adminId: number
  notes?: string
  restoreSending?: boolean
}): Promise<void> {
  const [flag] = await sql`
    SELECT user_id, status FROM red_flags WHERE id = ${opts.flagId} LIMIT 1
  `

  if (!flag || flag.status !== "active") return

  await sql`
    UPDATE red_flags
    SET status = 'cleared', cleared_at = NOW(), cleared_by = ${opts.adminId}, cleared_notes = ${opts.notes ?? null}
    WHERE id = ${opts.flagId}
  `

  if (opts.restoreSending !== false) {
    // Check if user has any other active flags
    const [remaining] = await sql`
      SELECT COUNT(*)::int AS count
      FROM red_flags
      WHERE user_id = ${flag.user_id} AND status = 'active' AND id != ${opts.flagId}
    `

    if (remaining.count === 0) {
      await sql`
        UPDATE users
        SET sending_status = 'active', updated_at = NOW()
        WHERE id = ${flag.user_id}
      `
    }
  }
}