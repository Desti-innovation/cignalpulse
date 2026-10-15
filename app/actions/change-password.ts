"use server"

import { sql } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/generate-credentials"
import { getSession, updateSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export type ChangePasswordResult = {
  success: boolean
  error?: string
}

export async function changePasswordAction(
  formData: FormData
): Promise<ChangePasswordResult> {
  // 1. Get current session
  const session = await getSession()
  if (!session) {
    return { success: false, error: "You must be logged in." }
  }

  const currentPassword = (formData.get("currentPassword") as string) || ""
  const newPassword = (formData.get("newPassword") as string) || ""
  const confirmPassword = (formData.get("confirmPassword") as string) || ""

  // 2. Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All fields are required." }
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      error: "New password must be at least 8 characters.",
    }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match." }
  }

  if (newPassword === currentPassword) {
    return {
      success: false,
      error: "New password must be different from your current password.",
    }
  }

  try {
    // 3. Verify current password
    const users = await sql`
      SELECT password_hash FROM users WHERE id = ${session.userId} LIMIT 1
    `
    if (users.length === 0) {
      return { success: false, error: "User not found." }
    }

    const isValid = await verifyPassword(currentPassword, users[0].password_hash)
    if (!isValid) {
      return { success: false, error: "Current password is incorrect." }
    }

    // 4. Hash and save new password + flip first_login to false
    const newHash = await hashPassword(newPassword)

    await sql`
      UPDATE users
      SET 
        password_hash = ${newHash},
        first_login = false,
        updated_at = NOW()
      WHERE id = ${session.userId}
    `

    // 5. Update session — only flip firstLogin.
    // profileCompleted stays as-is so middleware routes to /complete-profile next.
    await updateSession({ firstLogin: false })

    revalidatePath("/complete-profile")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Change password failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    }
  }
}