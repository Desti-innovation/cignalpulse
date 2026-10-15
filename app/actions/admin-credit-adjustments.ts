"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { logAdminAction } from "@/lib/audit"
import { revalidatePath } from "next/cache"

export type CreditAdjustment = {
  id: number
  user_id: number
  admin_id: number | null
  admin_username: string | null
  adjustment_type: string
  amount: number
  reason: string
  created_at: string
}

export async function listCreditAdjustments(
  userId: number,
  limit: number = 50
): Promise<CreditAdjustment[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      a.id, a.user_id, a.admin_id,
      ad.username AS admin_username,
      a.adjustment_type, a.amount, a.reason, a.created_at
    FROM credit_adjustments a
    LEFT JOIN admins ad ON a.admin_id = ad.id
    WHERE a.user_id = ${userId}
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    ...r,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  })) as CreditAdjustment[]
}

export async function adjustCreditsAction(
  userId: number,
  formData: FormData
): Promise<{ success: boolean; error?: string; message?: string }> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const amountRaw = formData.get("amount") as string
  const reason = (formData.get("reason") as string)?.trim()
  const adjustmentType = (formData.get("adjustment_type") as string) || "credit"

  const amount = parseInt(amountRaw, 10)
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: "Amount must be a positive number." }
  }
  if (!reason || reason.length < 3) {
    return { success: false, error: "Reason is required (at least 3 characters)." }
  }
  if (adjustmentType !== "credit" && adjustmentType !== "debit") {
    return { success: false, error: "Invalid adjustment type." }
  }

  const delta = adjustmentType === "credit" ? amount : -amount

  try {
    // Check that user has a wallet; create if missing
    const [wallet] = await sql`
      SELECT user_id FROM user_wallets WHERE user_id = ${userId} LIMIT 1
    `

    if (!wallet) {
      await sql`
        INSERT INTO user_wallets (user_id, sms_credits, balance_ghs)
        VALUES (${userId}, 0, 0)
      `
    }

    // Apply the adjustment
    await sql`
      UPDATE user_wallets
      SET sms_credits = GREATEST(sms_credits + ${delta}, 0),
          updated_at = NOW()
      WHERE user_id = ${userId}
    `

    // Log the adjustment
    await sql`
      INSERT INTO credit_adjustments (user_id, admin_id, adjustment_type, amount, reason)
      VALUES (${userId}, ${session.adminId}, ${adjustmentType}, ${amount}, ${reason})
    `

    await logAdminAction({
      action: "enable_user",
      targetType: "user",
      targetId: userId,
      metadata: { adjustmentType, amount, reason },
    })

    revalidatePath(`/admin/users/${userId}`)
    return {
      success: true,
      message: `${adjustmentType === "credit" ? "Credited" : "Debited"} ${amount} credits.`,
    }
  } catch (error) {
    console.error("Adjust credits failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Adjustment failed.",
    }
  }
}