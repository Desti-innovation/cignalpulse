"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { rateLimit, RateLimits, getClientIp } from "@/lib/rate-limit"
import {
  validateSenderId,
  validateEmail,
  validatePhone,
  validateString,
  validateUrl,
  sanitizeText,
} from "@/lib/validation"
import { headers } from "next/headers"

export type SenderIdRequestInput = {
  senderId: string
  companyName: string
  email: string
  phone: string
  useCase: string
  website: string
  notes?: string
}

function generateRequestId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `SID-${year}-${random}`
}

export async function submitSenderIdRequest(data: SenderIdRequestInput) {
  // ---- Rate limit by IP (3 submissions per hour) ----
  try {
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"

    const { limit, windowMs } = RateLimits.signup
    const rateCheck = rateLimit(`sender-id:${ip}`, limit, windowMs)

    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
      }
    }
  } catch {
    // If headers() fails (e.g. outside request context), continue
    // and rely on other validations.
  }

  // ---- Input validation ----
  const senderCheck = validateSenderId(data.senderId)
  if (!senderCheck.valid) {
    return { success: false, error: senderCheck.error }
  }

  const companyCheck = validateString(data.companyName, {
    required: true,
    minLength: 2,
    maxLength: 200,
    label: "Company name",
  })
  if (!companyCheck.valid) {
    return { success: false, error: companyCheck.error }
  }

  const emailCheck = validateEmail(data.email)
  if (!emailCheck.valid) {
    return { success: false, error: emailCheck.error }
  }

  const phoneCheck = validatePhone(data.phone)
  if (!phoneCheck.valid) {
    return { success: false, error: phoneCheck.error }
  }

  const useCaseCheck = validateString(data.useCase, {
    required: true,
    minLength: 3,
    maxLength: 200,
    label: "Use case",
  })
  if (!useCaseCheck.valid) {
    return { success: false, error: useCaseCheck.error }
  }

  const websiteCheck = validateUrl(data.website)
  if (!websiteCheck.valid) {
    return { success: false, error: websiteCheck.error }
  }

  // ---- Sanitize text fields ----
  const senderId = data.senderId.trim().toUpperCase()
  const companyName = sanitizeText(data.companyName.trim(), 200)
  const email = data.email.trim().toLowerCase()
  const phone = data.phone.trim()
  const useCase = sanitizeText(data.useCase.trim(), 200)
  const website = data.website.trim()
  const notes = data.notes ? sanitizeText(data.notes, 2000) : null

  try {
    const requestId = generateRequestId()

    const result = await sql`
      INSERT INTO sender_id_requests (
        request_id, sender_id, company_name, email, phone,
        use_case, website, notes, status
      ) VALUES (
        ${requestId}, ${senderId}, ${companyName}, ${email}, ${phone},
        ${useCase}, ${website}, ${notes}, 'pending'
      )
      RETURNING id, request_id, expected_at
    `

    const row = result[0]

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