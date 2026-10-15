"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { revalidatePath } from "next/cache"

// ---------- Types ----------

export type AdminUserRow = {
  id: number
  username: string
  email: string
  company_name: string
  display_name: string | null
  logo_url: string | null
  role: string
  is_active: boolean
  first_login: boolean
  profile_completed: boolean
  created_at: string
  sender_id: string | null
  request_id: string | null
  request_status: string | null
}

export type AdminUserStats = {
  total: number
  active: number
  inactive: number
  firstLoginPending: number
  profileIncomplete: number
}

export type AdminActionResult = {
  success: boolean
  error?: string
  message?: string
}

// ---------- Read: list all users ----------

export async function listUsers(): Promise<AdminUserRow[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      u.id,
      u.username,
      u.email,
      u.company_name,
      u.display_name,
      u.logo_url,
      u.role,
      u.is_active,
      u.first_login,
      u.profile_completed,
      u.created_at,
      r.sender_id,
      r.request_id,
      r.status AS request_status
    FROM users u
    LEFT JOIN sender_id_requests r ON u.sender_id_request_id = r.id
    ORDER BY u.created_at DESC
  `

  return rows as AdminUserRow[]
}

// ---------- Read: user stats ----------

export async function getUserStats(): Promise<AdminUserStats> {
  const session = await getAdminSession()
  if (!session) {
    return { total: 0, active: 0, inactive: 0, firstLoginPending: 0, profileIncomplete: 0 }
  }

  const rows = await sql`
    SELECT 
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_active = true)::int AS active,
      COUNT(*) FILTER (WHERE is_active = false)::int AS inactive,
      COUNT(*) FILTER (WHERE first_login = true)::int AS first_login_pending,
      COUNT(*) FILTER (WHERE profile_completed = false)::int AS profile_incomplete
    FROM users
  `

  const r = rows[0]
  return {
    total: r.total,
    active: r.active,
    inactive: r.inactive,
    firstLoginPending: r.first_login_pending,
    profileIncomplete: r.profile_incomplete,
  }
}

// ---------- Action: toggle user active state ----------

export async function toggleUserActiveAction(
  userId: number,
  active: boolean
): Promise<AdminActionResult> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated as admin." }

  try {
    await sql`
      UPDATE users
      SET 
        is_active = ${active},
        updated_at = NOW()
      WHERE id = ${userId}
    `

    revalidatePath("/admin/users")

    return {
      success: true,
      message: active ? "User activated." : "User disabled.",
    }
  } catch (error) {
    console.error("Toggle user active failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    }
  }
}

// ---------- Action: reset user password ----------

export async function resetUserPasswordAction(userId: number): Promise<
  AdminActionResult & { password?: string }
> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated as admin." }

  try {
    // Dynamically import helpers so we don't pull them into the top-level bundle
    const { hashPassword, generatePassword } = await import(
      "@/lib/generate-credentials"
    )

    const newPassword = generatePassword()
    const passwordHash = await hashPassword(newPassword)

    await sql`
      UPDATE users
      SET 
        password_hash = ${passwordHash},
        first_login = true,
        updated_at = NOW()
      WHERE id = ${userId}
    `

    revalidatePath("/admin/users")

    return {
      success: true,
      message: "Password reset. User must change it on next login.",
      password: newPassword,
    }
  } catch (error) {
    console.error("Reset password failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Reset failed.",
    }
  }
}