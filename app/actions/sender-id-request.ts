"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { rateLimit, RateLimits } from "@/lib/rate-limit"
import {
  validateSenderId,
  validateEmail,
  validatePhone,
  validateString,
  validateUrl,
  sanitizeText,
} from "@/lib/validation"
import { headers } from "next/headers"
import { encryptPhone } from "@/lib/phone-crypto"
import { sendEmail } from "@/lib/email"

export type SenderIdRequestInput = {
  senderId: string
  companyName: string
  email: string
  phone: string
  useCase: string
  website?: string
  notes?: string
}

function generateRequestId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `SID-${year}-${random}`
}

export async function submitSenderIdRequest(data: SenderIdRequestInput) {
  // Rate limit
  try {
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
    const { limit, windowMs } = RateLimits.signup
    const rateCheck = rateLimit(`sender-id:${ip}`, limit, windowMs)

    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many requests. Please try again in ${rateCheck.retryAfterSeconds ?? 60} seconds.`,
      }
    }
  } catch {
    // Continue if headers fail
  }

  // Input validation
  const senderCheck = validateSenderId(data.senderId)
  if (!senderCheck.valid) return { success: false, error: senderCheck.error }

  const companyCheck = validateString(data.companyName, { required: true, minLength: 2, maxLength: 200, label: "Company name" })
  if (!companyCheck.valid) return { success: false, error: companyCheck.error }

  const emailCheck = validateEmail(data.email)
  if (!emailCheck.valid) return { success: false, error: emailCheck.error }

  const phoneCheck = validatePhone(data.phone)
  if (!phoneCheck.valid) return { success: false, error: phoneCheck.error }

  const useCaseCheck = validateString(data.useCase, { required: true, minLength: 3, maxLength: 200, label: "Use case" })
  if (!useCaseCheck.valid) return { success: false, error: useCaseCheck.error }

  // Only validate URL if one was provided
  let website = ""
  if (data.website && data.website.trim() !== "") {
    const websiteCheck = validateUrl(data.website)
    if (!websiteCheck.valid) return { success: false, error: websiteCheck.error }
    website = data.website.trim()
  }

  // Sanitize
  const senderId = data.senderId.trim() 
  const companyName = sanitizeText(data.companyName.trim(), 200)
  const email = data.email.trim().toLowerCase()
  const useCase = sanitizeText(data.useCase.trim(), 200)
  const notes = data.notes ? sanitizeText(data.notes, 2000) : null
  const encryptedPhone = encryptPhone(data.phone.trim())

  if (!encryptedPhone) {
    return { success: false, error: "Failed to process phone number." }
  }

  try {
    const requestId = generateRequestId()

    // Save to DB
    const result = await sql`
      INSERT INTO sender_id_requests (
        request_id, sender_id, company_name, email, phone,
        use_case, website, notes, status
      ) VALUES (
        ${requestId}, ${senderId}, ${companyName}, ${email}, ${encryptedPhone},
        ${useCase}, ${website}, ${notes}, 'pending'
      )
      RETURNING id, request_id, expected_at
    `

    const row = result[0]

    // Send Email to Admin
    try {
      await sendEmail({
        to: "support@cignalpulse.com",
        subject: `New Sender ID Request: ${senderId}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">New Sender ID Request</h2>
            <p>A new customer has requested a Sender ID on CignalPulse.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 150px;">Company</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Sender ID</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 18px; color: #2563eb; font-weight: bold;">${senderId}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Use Case (Purpose)</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${useCase}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Email</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${email}</td>
              </tr>
            </table>

            <p style="margin-top: 24px;">
              <a href="https://sms.cignalpulse.com/admin/sender-ids" style="background: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Go to Admin Dashboard
              </a>
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error("[sender-id-request] Admin email failed:", emailError)
    }

    revalidatePath("/sender-id-status")

    return {
      success: true,
      requestId: row.request_id,
      expectedAt: row.expected_at,
    }
  } catch (error) {
    console.error("[sender-id-request] Failed:", error)
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    }
  }
}