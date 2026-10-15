"use server"

import { sql } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { sms } from "@/lib/signalpulse-sms"
import {
  resolveUserContact,
  resolveUserContactByIdentifier,
} from "@/lib/phones"
import {
  buildOtpSmsMessage,
  buildOtpEmailTemplate,
  buildPasswordChangedEmail,
  buildPasswordChangedSms,
} from "@/lib/password-reset-templates"
import { rateLimit, RateLimits } from "@/lib/rate-limit"
import { hashPassword } from "@/lib/generate-credentials"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// ============================================================
// Types
// ============================================================

export type RequestResetResult = {
  success: boolean
  error?: string
  channels?: { email: boolean; sms: boolean }
}

export type VerifyOtpResult = {
  success: boolean
  error?: string
  resetToken?: string
}

export type ResetPasswordResult = {
  success: boolean
  error?: string
}

// ============================================================
// Constants
// ============================================================

const OTP_TTL_MINUTES = 15
const RESET_TOKEN_TTL_MINUTES = 10
const MAX_OTP_ATTEMPTS = 5
const OTP_LENGTH = 6

const SYSTEM_SENDER_ID =
  process.env.SIGNALPULSE_SYSTEM_SENDER_ID || "CignalPulse"

// ============================================================
// Action 1 — Request a reset code
// ============================================================

export async function requestResetAction(
  formData: FormData
): Promise<RequestResetResult> {
  const identifier = (formData.get("identifier") as string)?.trim() || ""

  const rateKey = `pwreset:${identifier.toLowerCase() || "unknown"}`
  const { limit, windowMs } = RateLimits.login
  const rateCheck = rateLimit(rateKey, limit, windowMs)

  if (!rateCheck.allowed) {
    // Return generic success to avoid enumeration
    return { success: true }
  }

  if (!identifier) {
    return { success: false, error: "Please enter your username or email." }
  }

  const contact = await resolveUserContactByIdentifier(identifier)

  if (!contact) {
    return { success: true }
  }

  const otp = generateOtp(OTP_LENGTH)
  const otpHash = await bcrypt.hash(otp, 10)
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

  const canEmail = !!contact.email
  const canSms = !!contact.phone

  await sql`
    UPDATE password_resets
    SET consumed_at = NOW()
    WHERE user_id = ${contact.userId} AND consumed_at IS NULL
  `

  await sql`
    INSERT INTO password_resets (
      user_id, otp_hash, channel_email, channel_sms, expires_at
    ) VALUES (
      ${contact.userId},
      ${otpHash},
      ${canEmail},
      ${canSms},
      ${expiresAt.toISOString()}
    )
  `

  const deliveryPromises: Promise<unknown>[] = []

  if (canEmail && contact.email) {
    const [row] = await sql`
      SELECT display_name, company_name
      FROM users WHERE id = ${contact.userId} LIMIT 1
    `
    const displayName = row?.display_name || row?.company_name || "there"

    const tpl = buildOtpEmailTemplate({
      displayName,
      code: otp,
      channels: { email: canEmail, sms: canSms },
    })

    deliveryPromises.push(
      sendEmail({
        to: contact.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      })
    )
  }

  if (canSms && contact.phone) {
    deliveryPromises.push(
      sms.send({
        recipients: [contact.phone],
        senderId: SYSTEM_SENDER_ID,
        message: buildOtpSmsMessage(otp),
        isOtp: true,
      })
    )
  }

  void Promise.allSettled(deliveryPromises).then((results) => {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[password-reset] delivery ${i} failed:`, r.reason)
      }
    })
  })

  return {
    success: true,
    channels: { email: canEmail, sms: canSms },
  }
}

// ============================================================
// Action 2 — Verify OTP, issue reset token
// ============================================================

export async function verifyOtpAction(
  formData: FormData
): Promise<VerifyOtpResult> {
  const identifier = (formData.get("identifier") as string)?.trim() || ""
  const otp = (formData.get("otp") as string)?.trim() || ""

  if (!identifier || !otp) {
    return { success: false, error: "Please enter the code we sent you." }
  }

  if (!/^\d{6}$/.test(otp)) {
    return { success: false, error: "Code must be 6 digits." }
  }

  const contact = await resolveUserContactByIdentifier(identifier)
  if (!contact) {
    return { success: false, error: "Invalid or expired code." }
  }

  const [reset] = await sql`
    SELECT id, otp_hash, attempts, expires_at
    FROM password_resets
    WHERE user_id = ${contact.userId}
      AND consumed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `

  if (!reset) {
    return { success: false, error: "Invalid or expired code." }
  }

  if (new Date(reset.expires_at).getTime() < Date.now()) {
    await sql`
      UPDATE password_resets SET consumed_at = NOW() WHERE id = ${reset.id}
    `
    return {
      success: false,
      error: "This code has expired. Please request a new one.",
    }
  }

  if (reset.attempts >= MAX_OTP_ATTEMPTS) {
    await sql`
      UPDATE password_resets SET consumed_at = NOW() WHERE id = ${reset.id}
    `
    return {
      success: false,
      error: "Too many incorrect attempts. Please request a new code.",
    }
  }

  const isValid = await bcrypt.compare(otp, reset.otp_hash)

  if (!isValid) {
    await sql`
      UPDATE password_resets
      SET attempts = attempts + 1
      WHERE id = ${reset.id}
    `
    const remaining = MAX_OTP_ATTEMPTS - reset.attempts - 1
    return {
      success: false,
      error:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please request a new code.",
    }
  }

  const resetToken = crypto.randomBytes(32).toString("hex")
  const resetTokenHash = await bcrypt.hash(resetToken, 10)
  const resetExpiresAt = new Date(
    Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
  )

  await sql`
    UPDATE password_resets
    SET
      verified_at = NOW(),
      reset_token_hash = ${resetTokenHash},
      expires_at = ${resetExpiresAt.toISOString()}
    WHERE id = ${reset.id}
  `

  return { success: true, resetToken }
}

// ============================================================
// Action 3 — Reset the password
// ============================================================

export async function resetPasswordAction(
  formData: FormData
): Promise<ResetPasswordResult> {
  const identifier = (formData.get("identifier") as string)?.trim() || ""
  const resetToken = (formData.get("resetToken") as string)?.trim() || ""
  const newPassword = (formData.get("newPassword") as string) || ""
  const confirmPassword = (formData.get("confirmPassword") as string) || ""

  if (!identifier || !resetToken) {
    return { success: false, error: "Session expired. Please start over." }
  }

  if (!newPassword || !confirmPassword) {
    return { success: false, error: "Please fill in both fields." }
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters.",
    }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords don't match." }
  }

  const contact = await resolveUserContactByIdentifier(identifier)
  if (!contact) {
    return { success: false, error: "Session expired. Please start over." }
  }

  const [reset] = await sql`
    SELECT id, reset_token_hash, expires_at, verified_at
    FROM password_resets
    WHERE user_id = ${contact.userId}
      AND consumed_at IS NULL
      AND verified_at IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1
  `

  if (!reset || !reset.reset_token_hash) {
    return { success: false, error: "Session expired. Please start over." }
  }

  if (new Date(reset.expires_at).getTime() < Date.now()) {
    await sql`
      UPDATE password_resets SET consumed_at = NOW() WHERE id = ${reset.id}
    `
    return {
      success: false,
      error: "Reset link expired. Please start over.",
    }
  }

  const tokenValid = await bcrypt.compare(resetToken, reset.reset_token_hash)
  if (!tokenValid) {
    return { success: false, error: "Session expired. Please start over." }
  }

  const newHash = await hashPassword(newPassword)

  await sql`
    UPDATE users
    SET
      password_hash = ${newHash},
      first_login = false,
      updated_at = NOW()
    WHERE id = ${contact.userId}
  `

  await sql`
    UPDATE password_resets
    SET consumed_at = NOW()
    WHERE id = ${reset.id}
  `

  const [userRow] = await sql`
    SELECT display_name, company_name
    FROM users WHERE id = ${contact.userId} LIMIT 1
  `
  const displayName = userRow?.display_name || userRow?.company_name || "there"

  if (contact.email) {
    const tpl = buildPasswordChangedEmail({ displayName })
    void sendEmail({
      to: contact.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    }).catch((err) =>
      console.error("[password-reset] changed-email failed:", err)
    )
  }

  if (contact.phone) {
    void sms
      .send({
        recipients: [contact.phone],
        senderId: SYSTEM_SENDER_ID,
        message: buildPasswordChangedSms(),
      })
      .catch((err) =>
        console.error("[password-reset] changed-sms failed:", err)
      )
  }

  return { success: true }
}

// ============================================================
// Action 4 — Cancel (user abandons flow)
// ============================================================

export async function cancelResetAction(
  identifier: string
): Promise<{ success: boolean }> {
  try {
    const contact = await resolveUserContactByIdentifier(identifier)
    if (contact) {
      await sql`
        UPDATE password_resets
        SET consumed_at = NOW()
        WHERE user_id = ${contact.userId} AND consumed_at IS NULL
      `
    }
  } catch (error) {
    console.error("[password-reset] cancel failed:", error)
  }
  return { success: true }
}

// ============================================================
// Helpers
// ============================================================

function generateOtp(length: number): string {
  let otp = ""
  for (let i = 0; i < length; i++) {
    otp += crypto.randomInt(0, 10).toString()
  }
  return otp
}