"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { logAdminAction } from "@/lib/audit"
import { revalidatePath } from "next/cache"

export type Promo = {
  id: number
  code: string
  discount_percent: number
  applies_to_bundle_id: number | null
  bundle_name: string | null
  max_uses: number | null
  current_uses: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export async function listPromos(): Promise<Promo[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      p.id, p.code, p.discount_percent, p.applies_to_bundle_id,
      b.name AS bundle_name,
      p.max_uses, p.current_uses, p.expires_at, p.is_active, p.created_at
    FROM promos p
    LEFT JOIN sms_bundles b ON p.applies_to_bundle_id = b.id
    ORDER BY p.created_at DESC
  `

  return rows.map((r) => ({
    ...r,
    expires_at: r.expires_at instanceof Date ? r.expires_at.toISOString() : (r.expires_at ? String(r.expires_at) : null),
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  })) as Promo[]
}

export async function createPromoAction(formData: FormData): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const code = (formData.get("code") as string)?.trim().toUpperCase()
  const discount_percent = parseInt(formData.get("discount_percent") as string, 10)
  const applies_to_bundle_id = formData.get("applies_to_bundle_id") === "any"
    ? null
    : parseInt(formData.get("applies_to_bundle_id") as string, 10) || null
  const max_uses = parseInt(formData.get("max_uses") as string, 10) || null
  const expires_at = (formData.get("expires_at") as string)?.trim() || null

  if (!code || isNaN(discount_percent)) {
    return { success: false, error: "Code and discount are required." }
  }
  if (discount_percent < 1 || discount_percent > 100) {
    return { success: false, error: "Discount must be between 1 and 100." }
  }

  try {
    await sql`
      INSERT INTO promos (
        code, discount_percent, applies_to_bundle_id, max_uses, expires_at
      ) VALUES (
        ${code}, ${discount_percent}, ${applies_to_bundle_id}, ${max_uses}, ${expires_at}
      )
    `

    await logAdminAction({
      action: "check_sender_id_status",
      targetType: "system",
      metadata: { createdPromo: code, discount: discount_percent },
    })

    revalidatePath("/admin/promos")
    return { success: true, message: `Promo "${code}" created.` }
  } catch (error) {
    console.error("Create promo failed:", error)
    return { success: false, error: "Failed to create promo (code may already exist)." }
  }
}

export async function togglePromoActiveAction(
  promoId: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    await sql`
      UPDATE promos SET is_active = ${isActive} WHERE id = ${promoId}
    `
    revalidatePath("/admin/promos")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Update failed." }
  }
}

export async function deletePromoAction(
  promoId: number
): Promise<{ success: boolean; error?: string }> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    await sql`DELETE FROM promos WHERE id = ${promoId}`
    revalidatePath("/admin/promos")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Delete failed." }
  }
}