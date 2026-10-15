"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export type UserTemplate = {
  id: number
  name: string
  body: string
  created_at: string
  updated_at: string
}

export async function listUserTemplates(): Promise<UserTemplate[]> {
  const session = await getSession()
  if (!session) return []

  const rows = await sql`
    SELECT id, name, body, created_at, updated_at
    FROM user_templates
    WHERE user_id = ${session.userId}
    ORDER BY updated_at DESC
  `

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    body: r.body,
    created_at:
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    updated_at:
      r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  }))
}

export async function createUserTemplateAction(formData: FormData): Promise<{
  success: boolean
  error?: string
  message?: string
  templateId?: number
}> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const name = (formData.get("name") as string)?.trim()
  const body = (formData.get("body") as string)?.trim()

  if (!name || name.length < 2) {
    return { success: false, error: "Template name is required (at least 2 characters)." }
  }
  if (!body || body.length < 5) {
    return { success: false, error: "Template body is required (at least 5 characters)." }
  }

  try {
    const [row] = await sql`
      INSERT INTO user_templates (user_id, name, body)
      VALUES (${session.userId}, ${name}, ${body})
      RETURNING id
    `

    revalidatePath("/dashboard/templates")
    revalidatePath("/dashboard/send")

    return {
      success: true,
      message: "Template saved.",
      templateId: row.id,
    }
  } catch (error) {
    console.error("Create template failed:", error)
    return { success: false, error: "Failed to save template." }
  }
}

export async function deleteUserTemplateAction(templateId: number): Promise<{
  success: boolean
  error?: string
}> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    await sql`
      DELETE FROM user_templates
      WHERE id = ${templateId} AND user_id = ${session.userId}
    `
    revalidatePath("/dashboard/templates")
    revalidatePath("/dashboard/send")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Delete failed." }
  }
}

export async function updateUserTemplateAction(
  templateId: number,
  formData: FormData
): Promise<{ success: boolean; error?: string; message?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const name = (formData.get("name") as string)?.trim()
  const body = (formData.get("body") as string)?.trim()

  if (!name || name.length < 2) {
    return { success: false, error: "Template name is required (at least 2 characters)." }
  }
  if (!body || body.length < 5) {
    return { success: false, error: "Template body is required (at least 5 characters)." }
  }

  try {
    const result = await sql`
      UPDATE user_templates
      SET name = ${name}, body = ${body}, updated_at = NOW()
      WHERE id = ${templateId} AND user_id = ${session.userId}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, error: "Template not found." }
    }

    revalidatePath("/dashboard/templates")
    revalidatePath("/dashboard/send")

    return { success: true, message: "Template updated." }
  } catch (error) {
    console.error("Update template failed:", error)
    return { success: false, error: "Failed to update template." }
  }
}