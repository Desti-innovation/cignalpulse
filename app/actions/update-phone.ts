"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export type UpdatePhoneResult = {
  success: boolean
  error?: string
}

export async function updatePhoneAction(
  formData: FormData
): Promise<UpdatePhoneResult> {
  const session = await getSession()
  if (!session) {
    return { success: false, error: "You must be logged in." }
  }

  const raw = (formData.get("phone") as string)?.trim() || ""

  if (!raw) {
    await sql`UPDATE users SET phone = NULL, updated_at = NOW() WHERE id = ${session.userId}`
    revalidatePath("/dashboard/settings/organization")
    return { success: true }
  }

  // Normalize
  const hasPlus = raw.startsWith("+")
  const digits = raw.replace(/\D/g, "")

  if (digits.length < 9 || digits.length > 15) {
    return { success: false, error: "Please enter a valid phone number." }
  }

  const phone = hasPlus ? `+${digits}` : digits

  try {
    await sql`
      UPDATE users
      SET phone = ${phone}, updated_at = NOW()
      WHERE id = ${session.userId}
    `

    revalidatePath("/dashboard/settings/organization")
    return { success: true }
  } catch (error) {
    console.error("[update-phone] failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    }
  }
}