"use server"

import { sql } from "@/lib/db"
import { getSession, updateSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export type UpdateProfileResult = {
  success: boolean
  error?: string
}

export async function completeProfileAction(
  formData: FormData
): Promise<UpdateProfileResult> {
  const session = await getSession()
  if (!session) {
    return { success: false, error: "You must be logged in." }
  }

  const displayName = (formData.get("displayName") as string)?.trim() || ""

  if (!displayName) {
    return { success: false, error: "Display name is required." }
  }

  if (displayName.length > 60) {
    return { success: false, error: "Display name must be under 60 characters." }
  }

  try {
    await sql`
      UPDATE users
      SET 
        display_name = ${displayName},
        profile_completed = true,
        updated_at = NOW()
      WHERE id = ${session.userId}
    `

    // Update the session
    await updateSession({ profileCompleted: true })

    revalidatePath("/dashboard")
    revalidatePath("/complete-profile")

    return { success: true }
  } catch (error) {
    console.error("Complete profile failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    }
  }
}