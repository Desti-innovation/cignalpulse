"use server"

import { sql } from "@/lib/db"
import { verifyPassword } from "@/lib/generate-credentials"
import { createSession, deleteSession } from "@/lib/session"
import { rateLimit, RateLimits } from "@/lib/rate-limit"
import { validateUsername } from "@/lib/validation"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export type LoginResult = {
  success: boolean
  error?: string
  redirectTo?: string
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const username = (formData.get("username") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string

  // ---- Rate limit by username (stops brute force per account) ----
  const rateKey = `login:${username || "unknown"}`
  const { limit, windowMs } = RateLimits.login
  const rateCheck = rateLimit(rateKey, limit, windowMs)

  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    }
  }

  // ---- Basic validation ----
  if (!username || !password) {
    return { success: false, error: "Username and password are required." }
  }

  const usernameCheck = validateUsername(username)
  if (!usernameCheck.valid) {
    return { success: false, error: "Invalid username or password." }
  }

  if (password.length > 200) {
    return { success: false, error: "Invalid username or password." }
  }

  try {
    const users = await sql`
      SELECT 
        id, 
        username, 
        email, 
        password_hash, 
        role, 
        is_active, 
        first_login,
        profile_completed
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `

    if (users.length === 0) {
      return { success: false, error: "Invalid username or password." }
    }

    const user = users[0]

    if (!user.is_active) {
      return { success: false, error: "Your account has been disabled." }
    }

    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return { success: false, error: "Invalid username or password." }
    }

    // ---- Create the JWT session cookie ----
    await createSession({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstLogin: user.first_login,
      profileCompleted: user.profile_completed,
    })

    // ---- 🔑 THE FIX: stamp last_activity_at so the idle tracker
    //      doesn't see a stale timestamp from a previous session
    //      and immediately log the user back out ----
    await sql`
      UPDATE users
      SET last_activity_at = NOW()
      WHERE id = ${user.id}
    `

    let redirectTo = "/dashboard"
    if (user.first_login) {
      redirectTo = "/change-password"
    } else if (!user.profile_completed) {
      redirectTo = "/complete-profile"
    }

    return { success: true, redirectTo }
  } catch (error) {
    console.error("[login] Failed:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function logoutAction() {
  // Use the route handler approach for cookie deletion
  // (server actions can throw "unexpected response" when mutating cookies)
  const cookieStore = await cookies()
  cookieStore.delete("session")
  redirect("/login")
}