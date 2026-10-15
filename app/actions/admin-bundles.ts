"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { logAdminAction } from "@/lib/audit"
import { revalidatePath } from "next/cache"

export type BundleType = "non_expiry" | "expiry"

export type SmsBundle = {
  id: number
  name: string
  credits: number
  price_ghs: number
  bonus_credits: number
  description: string | null
  bundle_type: BundleType
  validity_days: number | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ============================================================
// Read
// ============================================================

export async function listBundles(): Promise<SmsBundle[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT * FROM sms_bundles
    ORDER BY bundle_type ASC, sort_order ASC, price_ghs ASC
  `

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    credits: r.credits,
    price_ghs: Number(r.price_ghs),
    bonus_credits: r.bonus_credits,
    description: r.description,
    bundle_type: (r.bundle_type ?? "non_expiry") as BundleType,
    validity_days: r.validity_days,
    is_active: r.is_active,
    sort_order: r.sort_order,
    created_at:
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    updated_at:
      r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  })) as SmsBundle[]
}

// ============================================================
// Create
// ============================================================

export async function createBundleAction(formData: FormData): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const name = (formData.get("name") as string)?.trim()
  const credits = parseInt(formData.get("credits") as string, 10)
  const price_ghs = parseFloat(formData.get("price_ghs") as string)
  const bonus_credits = parseInt(formData.get("bonus_credits") as string, 10) || 0
  const description = (formData.get("description") as string)?.trim() || null
  const sort_order = parseInt(formData.get("sort_order") as string, 10) || 0
  const bundle_type = ((formData.get("bundle_type") as string) ||
    "non_expiry") as BundleType
  const validity_days_raw = formData.get("validity_days") as string
  const validity_days =
    bundle_type === "expiry" && validity_days_raw
      ? parseInt(validity_days_raw, 10)
      : null

  // Validation
  if (!name || isNaN(credits) || isNaN(price_ghs)) {
    return { success: false, error: "Name, credits, and price are required." }
  }
  if (credits <= 0 || price_ghs <= 0) {
    return { success: false, error: "Credits and price must be positive." }
  }
  if (bundle_type !== "non_expiry" && bundle_type !== "expiry") {
    return { success: false, error: "Invalid bundle type." }
  }
  if (bundle_type === "expiry" && (!validity_days || validity_days <= 0)) {
    return {
      success: false,
      error: "Validity days is required for expiry bundles.",
    }
  }

  try {
    await sql`
      INSERT INTO sms_bundles (
        name, credits, price_ghs, bonus_credits, description,
        bundle_type, validity_days, sort_order
      ) VALUES (
        ${name}, ${credits}, ${price_ghs}, ${bonus_credits}, ${description},
        ${bundle_type}, ${validity_days}, ${sort_order}
      )
    `

    await logAdminAction({
      action: "check_sender_id_status",
      targetType: "system",
      metadata: { createdBundle: name, credits, price_ghs, bundle_type },
    })

    revalidatePath("/admin/bundles")
    return { success: true, message: `Bundle "${name}" created.` }
  } catch (error) {
    console.error("Create bundle failed:", error)
    return { success: false, error: "Failed to create bundle." }
  }
}

// ============================================================
// Update
// ============================================================

export async function updateBundleAction(
  bundleId: number,
  formData: FormData
): Promise<{ success: boolean; error?: string; message?: string }> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const name = (formData.get("name") as string)?.trim()
  const credits = parseInt(formData.get("credits") as string, 10)
  const price_ghs = parseFloat(formData.get("price_ghs") as string)
  const bonus_credits = parseInt(formData.get("bonus_credits") as string, 10) || 0
  const description = (formData.get("description") as string)?.trim() || null
  const sort_order = parseInt(formData.get("sort_order") as string, 10) || 0
  const bundle_type = ((formData.get("bundle_type") as string) ||
    "non_expiry") as BundleType
  const validity_days_raw = formData.get("validity_days") as string
  const validity_days =
    bundle_type === "expiry" && validity_days_raw
      ? parseInt(validity_days_raw, 10)
      : null

  // Validation
  if (!name || isNaN(credits) || isNaN(price_ghs)) {
    return { success: false, error: "Name, credits, and price are required." }
  }
  if (bundle_type === "expiry" && (!validity_days || validity_days <= 0)) {
    return {
      success: false,
      error: "Validity days is required for expiry bundles.",
    }
  }

  try {
    await sql`
      UPDATE sms_bundles
      SET 
        name = ${name},
        credits = ${credits},
        price_ghs = ${price_ghs},
        bonus_credits = ${bonus_credits},
        description = ${description},
        bundle_type = ${bundle_type},
        validity_days = ${validity_days},
        sort_order = ${sort_order},
        updated_at = NOW()
      WHERE id = ${bundleId}
    `

    await logAdminAction({
      action: "check_sender_id_status",
      targetType: "system",
      metadata: { updatedBundle: bundleId, name, price_ghs, bundle_type },
    })

    revalidatePath("/admin/bundles")
    return { success: true, message: "Bundle updated." }
  } catch (error) {
    console.error("Update bundle failed:", error)
    return { success: false, error: "Failed to update bundle." }
  }
}

// ============================================================
// Toggle Active
// ============================================================

export async function toggleBundleActiveAction(
  bundleId: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    await sql`
      UPDATE sms_bundles
      SET is_active = ${isActive}, updated_at = NOW()
      WHERE id = ${bundleId}
    `
    revalidatePath("/admin/bundles")
    return { success: true }
  } catch (error) {
    console.error("Toggle bundle failed:", error)
    return { success: false, error: "Update failed." }
  }
}