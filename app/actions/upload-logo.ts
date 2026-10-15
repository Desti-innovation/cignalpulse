"use server"

import { put, del } from "@vercel/blob"
import { sql } from "@/lib/db"
import { getSession, updateSession } from "@/lib/session"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

export type UploadResult = {
  success: boolean
  error?: string
  url?: string
}

export async function uploadLogoAction(formData: FormData): Promise<UploadResult> {
  const session = await getSession()
  if (!session) {
    return { success: false, error: "You must be logged in." }
  }

  const file = formData.get("logo") as File | null
  if (!file) {
    return { success: false, error: "No file selected." }
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Only PNG, JPG, or WEBP images are allowed.",
    }
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File must be under 2MB." }
  }

  try {
    // 1. Fetch current logo URL so we can delete the old one
    const [user] = await sql`
      SELECT logo_url FROM users WHERE id = ${session.userId} LIMIT 1
    `
    const oldLogoUrl = user?.logo_url

    // 2. Upload the new file to Vercel Blob
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "png"
    const filename = `logos/${session.userId}-${timestamp}.${extension}`

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // 3. Save the new URL in the DB
    await sql`
      UPDATE users
      SET logo_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${session.userId}
    `

    // 4. Delete the old logo (ignore errors)
    if (oldLogoUrl && oldLogoUrl.includes("blob.vercel-storage.com")) {
      try {
        await del(oldLogoUrl)
      } catch (err) {
        console.warn("Failed to delete old logo:", err)
      }
    }

    // 5. Refresh session (in case we later store logo in it)
    await updateSession({})

    return { success: true, url: blob.url }
  } catch (error) {
    console.error("Logo upload failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed.",
    }
  }
}