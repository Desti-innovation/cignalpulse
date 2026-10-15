"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export type UpdateOrganizationResult = {
  success: boolean
  error?: string
}

export async function updateOrganizationAction(
  formData: FormData
): Promise<UpdateOrganizationResult> {
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
        updated_at = NOW()
      WHERE id = ${session.userId}
    `

    // Revalidate pages that show the company name
    revalidatePath("/dashboard/settings/organization")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Update organization failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    }
  }
}