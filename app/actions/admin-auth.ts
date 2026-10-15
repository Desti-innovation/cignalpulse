"use server"

import { sql } from "@/lib/db"
import { verifyPassword } from "@/lib/generate-credentials"
import { createAdminSession, deleteAdminSession } from "@/lib/admin-session"
import { rateLimit, RateLimits, getClientIp } from "@/lib/rate-limit"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export type AdminLoginResult = {
  success: boolean
  error?: string
  redirectTo?: string
}

export async function adminLoginAction(
  formData: FormData
): Promise<AdminLoginResult> {
  const username = (formData.get("username") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string

  // ---- Rate limit by IP (3 attempts / 15 min) ----
  try {
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"

    const { limit, windowMs } = RateLimits.adminLogin
    const rateCheck = rateLimit(`admin-login:${ip}`, limit, windowMs)

    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many admin login attempts. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
      }
    }
  } catch {
    // Continue if headers() isn't available
  }

  if (!username || !password) {
    return { success: false, error: "Username and password are required." }
  }

  // Basic sanity limits
  if (username.length > 100 || password.length > 200) {
    return { success: false, error: "Invalid admin credentials." }
  }

  try {
    const admins = await sql`
      SELECT id, username, email, password_hash, full_name, is_active
      FROM admins
      WHERE username = ${username}
      LIMIT 1
    `

    if (admins.length === 0) {
      return { success: false, error: "Invalid admin credentials." }
    }

    const admin = admins[0]

    if (!admin.is_active) {
      return { success: false, error: "This admin account is disabled." }
    }

    const isValid = await verifyPassword(password, admin.password_hash)
    if (!isValid) {
      return { success: false, error: "Invalid admin credentials." }
    }

    await sql`
      UPDATE admins
      SET last_login_at = NOW()
      WHERE id = ${admin.id}
    `

    await createAdminSession({
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
      fullName: admin.full_name,
      role: "admin",
    })

    return { success: true, redirectTo: "/admin" }
  } catch (error) {
    console.error("[admin-login] Failed:", error)
    return { success: false, error: "Something went wrong." }
  }
}

export async function adminLogoutAction() {
  await deleteAdminSession()
  redirect("/admin/login")
}