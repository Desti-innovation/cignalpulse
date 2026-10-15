"use server"

import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/generate-credentials"
import { createSession } from "@/lib/session"
import { rateLimit, RateLimits } from "@/lib/rate-limit"
import { validateUsername } from "@/lib/validation"
import { headers } from "next/headers"

// ============================================================
// Types
// ============================================================

export type SignupResult = {
  success: boolean
  error?: string
  userId?: number
}

// ============================================================
// Action
// ============================================================

export async function signupAction(
  formData: FormData
): Promise<SignupResult> {
  const companyName = (formData.get("companyName") as string)?.trim() || ""
  const username = (formData.get("username") as string)?.trim().toLowerCase() || ""
  const email = (formData.get("email") as string)?.trim().toLowerCase() || ""
  const phone = (formData.get("phone") as string)?.trim() || ""
  const password = (formData.get("password") as string) || ""
  const confirmPassword = (formData.get("confirmPassword") as string) || ""

  // ---- Rate limit by IP (10 signups/hour) ----
  const headersList = await headers()
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"

  const rateCheck = rateLimit(`signup:${ip}`, 10, 60 * 60 * 1000)
  if (!rateCheck.allowed) {
    const wait = Math.max(
      1,
      Math.ceil((rateCheck.retryAfterSeconds ?? 60) / 60)
    )
    return {
      success: false,
      error: `Too many signups from this network. Please try again in ${wait} minute${wait === 1 ? "" : "s"}.`,
    }
  }

  // ---- Validation ----
  if (!companyName || !username || !email || !phone || !password) {
    return { success: false, error: "All fields are required." }
  }

  if (companyName.length > 100) {
    return { success: false, error: "Company name is too long." }
  }

  const usernameCheck = validateUsername(username)
  if (!usernameCheck.valid) {
    return {
      success: false,
      error:
        usernameCheck.error ||
        "Username can only contain letters, numbers, and dashes.",
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." }
  }

  // ---- Normalize phone ----
  const hasPlus = phone.startsWith("+")
  const phoneDigits = phone.replace(/\D/g, "")
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    return {
      success: false,
      error: "Please enter a valid phone number (e.g. +233 59 342 5854).",
    }
  }
  const normalizedPhone = hasPlus ? `+${phoneDigits}` : phoneDigits

  // ---- Password checks ----
  if (password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters.",
    }
  }

  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return {
      success: false,
      error: "Password must contain both letters and numbers.",
    }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." }
  }

  try {
    // ---- Check for duplicates ----
    const existing = await sql`
      SELECT id, username, email FROM users
      WHERE LOWER(username) = ${username} OR LOWER(email) = ${email}
      LIMIT 1
    `

    if (existing.length > 0) {
      const row = existing[0]
      if (row.username.toLowerCase() === username) {
        return {
          success: false,
          error: "That username is already taken. Please choose another.",
        }
      }
      if (row.email.toLowerCase() === email) {
        return {
          success: false,
          error:
            "An account with that email already exists. Try logging in instead.",
        }
      }
    }

    // ---- Hash password ----
    const passwordHash = await hashPassword(password)

    // ---- Create user + wallet in a transaction ----
    const [user] = await sql`
      INSERT INTO users (
        username, email, password_hash, company_name, display_name, phone,
        role, is_active, first_login, profile_completed, sending_status
      ) VALUES (
        ${username},
        ${email},
        ${passwordHash},
        ${companyName},
        ${companyName},
        ${normalizedPhone},
        'user',
        true,
        false,
        false,
        'active'
      )
      RETURNING id
    `

    // ---- Create the wallet row ----
    await sql`
      INSERT INTO user_wallets (user_id, balance_ghs, sms_credits, lifetime_topup_ghs)
      VALUES (${user.id}, 0, 0, 0)
      ON CONFLICT (user_id) DO NOTHING
    `

    // ---- Create the JWT session ----
    await createSession({
      userId: user.id,
      username,
      email,
      role: "user",
      firstLogin: false,
      profileCompleted: false,
    })

    // ---- Stamp last_activity_at so the idle tracker doesn't bounce them ----
    await sql`
      UPDATE users SET last_activity_at = NOW() WHERE id = ${user.id}
    `

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("[signup] failed:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
    }
  }
}