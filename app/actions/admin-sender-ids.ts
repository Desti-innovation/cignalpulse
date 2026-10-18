"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { sms } from "@/lib/signalpulse-sms"
import { hashPassword, generatePassword, generateUsername } from "@/lib/generate-credentials"
import { decryptPhone } from "@/lib/phone-crypto"
import { revalidatePath } from "next/cache"

// ---------- Types ----------

export type SenderIdRequestRow = {
  id: number
  request_id: string
  sender_id: string
  company_name: string
  email: string
  phone: string
  use_case: string
  website: string
  notes: string | null
  status: string
  gateway_status: string | null
  submitted_at: string
  approved_at: string | null
  reviewed_at: string | null
  created_user_id: number | null
}

export type AdminActionResult = {
  success: boolean
  error?: string
  message?: string
}

// ---------- Read: list all requests ----------

export async function listSenderIdRequests(): Promise<SenderIdRequestRow[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      id, request_id, sender_id, company_name, email, phone,
      use_case, website, notes, status, gateway_status,
      submitted_at, approved_at, reviewed_at, created_user_id
    FROM sender_id_requests
    ORDER BY 
      CASE status 
        WHEN 'pending' THEN 1
        WHEN 'submitted' THEN 2
        WHEN 'approved' THEN 3
        WHEN 'rejected' THEN 4
        ELSE 5
      END,
      submitted_at DESC
  `

  return rows as SenderIdRequestRow[]
}

// ---------- Read: get stats for the dashboard ----------

export async function getSenderIdStats() {
  const session = await getAdminSession()
  if (!session) return { total: 0, pending: 0, submitted: 0, approved: 0, rejected: 0 }

  const rows = await sql`
    SELECT 
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
    FROM sender_id_requests
  `

  return rows[0] as {
    total: number
    pending: number
    submitted: number
    approved: number
    rejected: number
  }
}

// ---------- Action: Submit request to the gateway ----------

export async function submitToGatewayAction(
  requestDbId: number,
  editedSenderId?: string,
  editedUseCase?: string
): Promise<AdminActionResult> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated as admin." }

  const [request] = await sql`
    SELECT id, request_id, sender_id, company_name, use_case, status
    FROM sender_id_requests
    WHERE id = ${requestDbId}
    LIMIT 1
  `

  if (!request) return { success: false, error: "Request not found." }

  if (request.status === "approved" || request.status === "rejected") {
    return { success: false, error: "This request has already been resolved." }
  }

  // Use edited values if provided, otherwise fall back to stored values
  const senderIdToSubmit = editedSenderId?.trim() || request.sender_id
  const useCaseToSubmit = editedUseCase?.trim() || request.use_case || "Business messaging"

  // If values changed, update the DB first
  if (senderIdToSubmit !== request.sender_id || useCaseToSubmit !== request.use_case) {
    await sql`
      UPDATE sender_id_requests
      SET sender_id = ${senderIdToSubmit}, use_case = ${useCaseToSubmit}
      WHERE id = ${request.id}
    `
  }

  // Call the SignalPulse SMS gateway
  const result = await sms.registerSenderIdRaw(
    senderIdToSubmit,
    useCaseToSubmit
  )

  // Log the gateway interaction
  await sql`
    INSERT INTO sender_id_gateway_logs (
      request_id, action, gateway_status, response_payload, performed_by
    ) VALUES (
      ${request.id}, 'submit', ${result.gatewayStatus},
      ${JSON.stringify(result.raw)}::jsonb, ${session.adminId}
    )
  `

  if (result.status !== "success") {
    return {
      success: false,
      error: result.error || "Gateway rejected the submission.",
    }
  }

  // Update the request row
  await sql`
    UPDATE sender_id_requests
    SET 
      status = 'submitted',
      gateway_status = ${result.gatewayStatus},
      reviewed_by = ${session.adminId},
      reviewed_at = NOW()
    WHERE id = ${request.id}
  `

  revalidatePath("/admin")
  revalidatePath("/admin/sender-ids")

  return {
    success: true,
    message: `Submitted "${senderIdToSubmit}" to the network. Current status: ${result.gatewayStatus}`,
  }
}

// ---------- Action: Check status with the gateway ----------

export async function checkGatewayStatusAction(requestDbId: number): Promise<AdminActionResult> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated as admin." }

  const [request] = await sql`
    SELECT id, sender_id, status
    FROM sender_id_requests
    WHERE id = ${requestDbId}
    LIMIT 1
  `

  if (!request) return { success: false, error: "Request not found." }

  const result = await sms.getSenderIdStatusRaw(request.sender_id)

  await sql`
    INSERT INTO sender_id_gateway_logs (
      request_id, action, gateway_status, response_payload, performed_by
    ) VALUES (
      ${request.id}, 'status_check', ${result.gatewayStatus},
      ${JSON.stringify(result.raw)}::jsonb, ${session.adminId}
    )
  `

  await sql`
    UPDATE sender_id_requests
    SET 
      gateway_status = ${result.gatewayStatus},
      reviewed_by = ${session.adminId},
      reviewed_at = NOW()
    WHERE id = ${request.id}
  `

  revalidatePath("/admin")
  revalidatePath("/admin/sender-ids")

  return {
    success: true,
    message: `Gateway status for "${request.sender_id}": ${result.gatewayStatus}`,
  }
}

// ---------- Action: Approve for user (creates the account + sends welcome email + SMS) ----------

export async function approveForUserAction(requestDbId: number): Promise<AdminActionResult> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated as admin." }

  const [request] = await sql`
    SELECT *
    FROM sender_id_requests
    WHERE id = ${requestDbId}
    LIMIT 1
  `

  if (!request) return { success: false, error: "Request not found." }

  if (request.status === "approved") {
    return { success: false, error: "This request has already been approved." }
  }

  if (request.status === "rejected") {
    return { success: false, error: "This request was rejected and cannot be approved." }
  }

  try {
    // Generate credentials
    let username = generateUsername(request.company_name)
    const plainPassword = generatePassword()
    const passwordHash = await hashPassword(plainPassword)

    // Ensure username uniqueness
    let suffix = 1
    let finalUsername = username
    while (true) {
      const existing = await sql`SELECT id FROM users WHERE username = ${finalUsername} LIMIT 1`
      if (existing.length === 0) break
      suffix++
      finalUsername = `${username}${suffix}`
    }
    username = finalUsername

    // Create the user
    const [newUser] = await sql`
      INSERT INTO users (
        username, email, password_hash, company_name, role,
        sender_id_request_id, is_active, first_login, profile_completed
      ) VALUES (
        ${username}, ${request.email}, ${passwordHash}, ${request.company_name}, 'user',
        ${request.id}, true, true, false
      )
      RETURNING id, username, email
    `

    // Update the request
    await sql`
      UPDATE sender_id_requests
      SET 
        status = 'approved',
        approved_at = NOW(),
        created_user_id = ${newUser.id},
        reviewed_by = ${session.adminId},
        reviewed_at = NOW()
      WHERE id = ${request.id}
    `

    // Log the admin approval
    await sql`
      INSERT INTO sender_id_gateway_logs (
        request_id, action, gateway_status, response_payload, performed_by
      ) VALUES (
        ${request.id}, 'approve', ${request.gateway_status ?? "unknown"},
        ${JSON.stringify({ user_id: newUser.id, username })}::jsonb,
        ${session.adminId}
      )
    `

    // Send welcome email with credentials
    try {
      const { sendEmail } = await import("@/lib/email")
      const { renderWelcomeEmail } = await import("@/lib/email-templates/welcome")

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000"

      const email = renderWelcomeEmail({
        companyName: request.company_name,
        username,
        password: plainPassword,
        loginUrl: `${baseUrl}/login`,
        supportEmail: process.env.EMAIL_REPLY_TO || "support@signalpulse.com",
      })

      const emailResult = await sendEmail({
        to: request.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      })

      if (!emailResult.success) {
        console.warn(
          `[approveForUser] Welcome email to ${request.email} failed:`,
          emailResult.error
        )
      }
    } catch (emailError) {
      console.error("[approveForUser] Welcome email threw:", emailError)
    }

    // Send welcome SMS
    try {
      const userPhone = request.phone ? decryptPhone(request.phone) : null
      
      if (userPhone) {
        const platformSenderId = process.env.SIGNALPULSE_SYSTEM_SENDER_ID || "CignalPulse"
        
        const smsResult = await sms.send({
          recipients: [userPhone],
          senderId: platformSenderId,
          message: `Welcome to CignalPulse! Your Sender ID "${request.sender_id}" is approved. Log in at ${process.env.NEXT_PUBLIC_APP_URL || 'https://sms.cignalpulse.com'}/login`,
        })

        if (!smsResult.success) {
          console.warn(`[approveForUser] Welcome SMS to ${userPhone} failed:`, smsResult.error)
        }
      }
    } catch (smsError) {
      console.error("[approveForUser] Welcome SMS threw:", smsError)
    }

    revalidatePath("/admin")
    revalidatePath("/admin/sender-ids")

    return {
      success: true,
      message: `User created: ${username} (password: ${plainPassword})`,
    }
  } catch (error) {
    console.error("Approve for user failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Approval failed.",
    }
  }
}

// ---------- Action: Reject ----------

export async function rejectRequestAction(
  requestDbId: number,
  reason?: string
): Promise<AdminActionResult> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated as admin." }

  const [request] = await sql`
    SELECT id, status FROM sender_id_requests WHERE id = ${requestDbId} LIMIT 1
  `

  if (!request) return { success: false, error: "Request not found." }
  if (request.status === "approved") {
    return { success: false, error: "Cannot reject an already approved request." }
  }

  await sql`
    UPDATE sender_id_requests
    SET 
      status = 'rejected',
      reviewed_by = ${session.adminId},
      reviewed_at = NOW()
    WHERE id = ${request.id}
  `

  await sql`
    INSERT INTO sender_id_gateway_logs (
      request_id, action, gateway_status, response_payload, performed_by
    ) VALUES (
      ${request.id}, 'reject', ${null},
      ${JSON.stringify({ reason: reason ?? "No reason provided" })}::jsonb,
      ${session.adminId}
    )
  `

  revalidatePath("/admin")
  revalidatePath("/admin/sender-ids")

  return { success: true, message: "Request rejected." }
}