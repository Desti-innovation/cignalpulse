import "server-only"
import { Resend } from "resend"

// ============================================================
// Configuration
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || "CignalPulse <noreply@cignalpulse.com"
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO

if (!RESEND_API_KEY) {
  console.warn(
    "[email] RESEND_API_KEY is not configured — emails will be skipped."
  )
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

// ============================================================
// Types
// ============================================================

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export type SendEmailResult = {
  success: boolean
  id?: string
  error?: string
}

// ============================================================
// Public API
// ============================================================

/**
 * Sends an email via Resend. Fails silently (logs to console) so
 * email issues never block the primary operation.
 */
export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  if (!resend) {
    console.warn("[email] Skipped — RESEND_API_KEY not set")
    return { success: false, error: "Email service not configured." }
  }

  if (!input.to || (Array.isArray(input.to) && input.to.length === 0)) {
    return { success: false, error: "No recipient specified." }
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo || EMAIL_REPLY_TO,
    })

    if (result.error) {
      console.error("[email] Send failed:", result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error("[email] Exception:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    }
  }
}