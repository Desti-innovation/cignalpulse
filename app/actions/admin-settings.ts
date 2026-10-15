"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { hashPassword, verifyPassword } from "@/lib/generate-credentials"
import { logAdminAction } from "@/lib/audit"
import { revalidatePath } from "next/cache"

export type AdminProfile = {
  id: number
  username: string
  email: string
  full_name: string
  created_at: string
  last_login_at: string | null
}

export type PlatformSettings = {
  platformName: string
  supportEmail: string
  defaultCountryCode: string
  maintenanceMode: boolean
}

// ---------- Read ----------

export async function getAdminProfile(): Promise<AdminProfile | null> {
  const session = await getAdminSession()
  if (!session) return null

  const [row] = await sql`
    SELECT id, username, email, full_name, created_at, last_login_at
    FROM admins
    WHERE id = ${session.adminId}
    LIMIT 1
  `
  return row as AdminProfile | null
}

// ---------- Update admin profile ----------

export async function updateAdminProfileAction(formData: FormData): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const fullName = (formData.get("fullName") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()

  if (!fullName || fullName.length < 2) {
    return { success: false, error: "Full name must be at least 2 characters." }
  }
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please provide a valid email address." }
  }

  try {
    const dupe = await sql`
      SELECT id FROM admins WHERE email = ${email} AND id != ${session.adminId} LIMIT 1
    `
    if (dupe.length > 0) {
      return { success: false, error: "That email is already in use." }
    }

    await sql`
      UPDATE admins
      SET full_name = ${fullName}, email = ${email}, updated_at = NOW()
      WHERE id = ${session.adminId}
    `

    await logAdminAction({
      action: "check_sender_id_status", // reuse existing enum; will expand later if needed
      targetType: "system",
      metadata: { updatedFields: ["full_name", "email"] },
    })

    revalidatePath("/admin/settings")
    return { success: true, message: "Profile updated." }
  } catch (error) {
    console.error("Update admin profile failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    }
  }
}

// ---------- Change admin password ----------

export async function changeAdminPasswordAction(formData: FormData): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const currentPassword = (formData.get("currentPassword") as string) || ""
  const newPassword = (formData.get("newPassword") as string) || ""
  const confirmPassword = (formData.get("confirmPassword") as string) || ""

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All password fields are required." }
  }
  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." }
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match." }
  }
  if (newPassword === currentPassword) {
    return { success: false, error: "New password must be different." }
  }

  try {
    const [admin] = await sql`
      SELECT password_hash FROM admins WHERE id = ${session.adminId} LIMIT 1
    `
    if (!admin) return { success: false, error: "Admin not found." }

    const valid = await verifyPassword(currentPassword, admin.password_hash)
    if (!valid) {
      return { success: false, error: "Current password is incorrect." }
    }

    const hash = await hashPassword(newPassword)
    await sql`
      UPDATE admins SET password_hash = ${hash}, updated_at = NOW()
      WHERE id = ${session.adminId}
    `

    await logAdminAction({
      action: "check_sender_id_status", // reuse for now
      targetType: "system",
      metadata: { updatedFields: ["password"] },
    })

    return { success: true, message: "Password updated." }
  } catch (error) {
    console.error("Change admin password failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    }
  }
}

// ---------- Platform settings (read from platform_settings table) ----------

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const session = await getAdminSession()
  if (!session) {
    return {
      platformName: "SignalPulse",
      supportEmail: "",
      defaultCountryCode: "+233",
      maintenanceMode: false,
    }
  }

  const rows = await sql`
    SELECT key, value FROM platform_settings
  `

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  return {
    platformName: map.platform_name ?? "SignalPulse",
    supportEmail: map.support_email ?? "",
    defaultCountryCode: map.default_country_code ?? "+233",
    maintenanceMode: map.maintenance_mode === "true",
  }
}

export async function updatePlatformSettingsAction(formData: FormData): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const platformName = (formData.get("platformName") as string)?.trim() || "SignalPulse"
  const supportEmail = (formData.get("supportEmail") as string)?.trim() || ""
  const defaultCountryCode = (formData.get("defaultCountryCode") as string)?.trim() || "+233"
  const maintenanceMode = formData.get("maintenanceMode") === "on"

  try {
    const entries: Array<[string, string]> = [
      ["platform_name", platformName],
      ["support_email", supportEmail],
      ["default_country_code", defaultCountryCode],
      ["maintenance_mode", maintenanceMode ? "true" : "false"],
    ]

    for (const [key, value] of entries) {
      await sql`
        INSERT INTO platform_settings (key, value, updated_at)
        VALUES (${key}, ${value}, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW()
      `
    }

    await logAdminAction({
      action: "check_sender_id_status",
      targetType: "system",
      metadata: { updatedFields: ["platform_settings"] },
    })

    revalidatePath("/admin/settings")
    return { success: true, message: "Platform settings saved." }
  } catch (error) {
    console.error("Update platform settings failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Save failed.",
    }
  }
}