"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { revalidatePath } from "next/cache"

export type PlatformTemplate = {
  id: number
  code: string
  name: string
  channel: "email" | "sms"
  subject: string | null
  body: string
  description: string | null
  is_active: boolean
  updated_at: string
}

export async function listTemplates(): Promise<PlatformTemplate[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT id, code, name, channel, subject, body, description, is_active, updated_at
    FROM platform_templates
    ORDER BY channel, name
  `

  return rows.map((r) => ({
    ...r,
    updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  })) as PlatformTemplate[]
}

export async function updateTemplateAction(
  templateId: number,
  formData: FormData
): Promise<{ success: boolean; error?: string; message?: string }> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const name = (formData.get("name") as string)?.trim()
  const subject = (formData.get("subject") as string)?.trim() || null
  const body = (formData.get("body") as string)?.trim()

  if (!name || !body) {
    return { success: false, error: "Name and body are required." }
  }

  try {
    await sql`
      UPDATE platform_templates
      SET name = ${name}, subject = ${subject}, body = ${body}, updated_at = NOW()
      WHERE id = ${templateId}
    `

    revalidatePath("/admin/templates")
    return { success: true, message: "Template updated." }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    }
  }
}

export async function toggleTemplateAction(
  templateId: number,
  isActive: boolean
): Promise<{ success: boolean }> {
  const session = await getAdminSession()
  if (!session) return { success: false }

  await sql`
    UPDATE platform_templates SET is_active = ${isActive}, updated_at = NOW()
    WHERE id = ${templateId}
  `

  revalidatePath("/admin/templates")
  return { success: true }
}

/**
 * Renders a template with variable substitution.
 * Usage: renderTemplate('red_flag_notice', { company: 'Acme', reason: 'unusual activity' })
 */
export async function renderTemplate(
  code: string,
  vars: Record<string, string>
): Promise<string> {
  const [t] = await sql`
    SELECT body FROM platform_templates WHERE code = ${code} AND is_active = true LIMIT 1
  `

  if (!t) return ""

  let out = t.body as string
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`[${key}]`, value)
  }
  return out
}