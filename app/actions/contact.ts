"use server"

import { sendEmail } from "@/lib/email"
import { rateLimit, RateLimits } from "@/lib/rate-limit"
import { headers } from "next/headers"

// ============================================================
// Config — contact aliases
// ============================================================

const ALIASES = {
  support: "support@cignalpulse.com",
  billing: "billing@cignalpulse.com",
  sales: "hello@cignalpulse.com",
  abuse: "abuse@cignalpulse.com",
  other: "hello@cignalpulse.com",
} as const

type Topic = keyof typeof ALIASES

const VALID_TOPICS: Topic[] = [
  "support",
  "billing",
  "sales",
  "abuse",
  "other",
]

// ============================================================
// Types
// ============================================================

export type ContactResult = {
  success: boolean
  error?: string
}

// ============================================================
// Action
// ============================================================

export async function sendContactMessageAction(
  formData: FormData
): Promise<ContactResult> {
  const name = (formData.get("name") as string)?.trim() || ""
  const email = (formData.get("email") as string)?.trim().toLowerCase() || ""
  const topicRaw = (formData.get("topic") as string)?.trim() || ""
  const subject = (formData.get("subject") as string)?.trim() || ""
  const message = (formData.get("message") as string)?.trim() || ""

  // ---- Validation ----
  if (!name || !email || !subject || !message) {
    return { success: false, error: "Please fill in all required fields." }
  }

  if (name.length > 100) {
    return { success: false, error: "Name is too long." }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." }
  }

  if (subject.length > 150) {
    return { success: false, error: "Subject is too long." }
  }

  if (message.length < 10) {
    return { success: false, error: "Please write a bit more detail." }
  }

  if (message.length > 5000) {
    return { success: false, error: "Message is too long (max 5000 chars)." }
  }

  const topic: Topic = VALID_TOPICS.includes(topicRaw as Topic)
    ? (topicRaw as Topic)
    : "other"

  // ---- Rate limit by IP (5 messages/hour) ----
  const headersList = await headers()
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"

    const rateCheck = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)
  if (!rateCheck.allowed) {
    const waitMinutes = Math.max(
      1,
      Math.ceil((rateCheck.retryAfterSeconds ?? 60) / 60)
    )
    return {
      success: false,
      error: `Too many messages. Please try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
    }
  }

  // ---- Route to the right alias ----
  const to = ALIASES[topic]

  // ---- Compose email ----
  const emailSubject = `[${topic.toUpperCase()}] ${subject}`

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:24px 28px;background:#2563eb;color:#ffffff;">
                <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;opacity:0.9;">Contact form · ${topic}</p>
                <h1 style="margin:6px 0 0 0;font-size:20px;font-weight:700;">${escapeHtml(subject)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="padding-bottom:8px;font-size:13px;color:#6b7280;width:100px;">From</td>
                    <td style="padding-bottom:8px;font-size:14px;color:#111827;font-weight:600;">${escapeHtml(name)}</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;font-size:13px;color:#6b7280;">Email</td>
                    <td style="padding-bottom:8px;font-size:14px;color:#2563eb;"><a href="mailto:${escapeHtml(email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(email)}</a></td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;font-size:13px;color:#6b7280;">Topic</td>
                    <td style="padding-bottom:8px;font-size:14px;color:#111827;">${escapeHtml(topic)}</td>
                  </tr>
                </table>

                <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
                  <p style="margin:0 0 8px 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Message</p>
                  <div style="font-size:14px;color:#111827;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px 28px;">
                <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    Reply directly to this email to respond to ${escapeHtml(name)}.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `Contact form submission

From: ${name} <${email}>
Topic: ${topic}
Subject: ${subject}

${message}

---
Reply to this email to respond to ${name}.`

  // ---- Send with replyTo = user's email so we can reply directly ----
  const result = await sendEmail({
    to,
    subject: emailSubject,
    html,
    text,
    replyTo: email,
  })

  if (!result.success) {
    console.error("[contact] email send failed:", result.error)
    return {
      success: false,
      error:
        "We couldn't send your message. Please email us directly at support@cignalpulse.com.",
    }
  }

  return { success: true }
}

// ============================================================
// Helpers
// ============================================================

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}