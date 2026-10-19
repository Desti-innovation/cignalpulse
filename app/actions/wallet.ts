"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { paystack, PLATFORM_FEE_GHS, estimatePaystackFee } from "@/lib/paystack"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createNotification } from "@/app/actions/notifications"

// ============================================================
// Types
// ============================================================

export type WalletBundle = {
  id: number
  name: string
  credits: number
  price_ghs: number
  bonus_credits: number
  description: string | null
  bundle_type: "non_expiry" | "expiry"
  validity_days: number | null
  sort_order: number
}

export type WalletTransaction = {
  id: number
  reference: string
  type: "wallet_topup" | "bundle_purchase"
  amount_ghs: number
  credits: number
  bonus_credits: number
  status: string
  initiated_at: string
  completed_at: string | null
  bundle_name: string | null
}

export type WalletData = {
  balanceGhs: number
  smsCredits: number
  lifetimeTopupGhs: number
  bundles: WalletBundle[]
  transactions: WalletTransaction[]
  expiringSoon: {
    creditsRemaining: number
    expiresAt: string
  } | null
}

const LOW_BALANCE_GHS = 10
const LOW_CREDITS = 50

// ============================================================
// Read — fetch wallet data
// ============================================================

export async function getWalletData(): Promise<WalletData | null> {
  const session = await getSession()
  if (!session) return null

  const [walletRows, bundleRows, txRows, expiryRows] = await Promise.all([
    sql`
      SELECT 
        COALESCE(balance_ghs, 0)::numeric AS balance_ghs,
        COALESCE(sms_credits, 0)::int AS sms_credits,
        COALESCE(lifetime_topup_ghs, 0)::numeric AS lifetime_topup_ghs
      FROM user_wallets
      WHERE user_id = ${session.userId}
      LIMIT 1
    `,
    sql`
      SELECT 
        id, name, credits, price_ghs, bonus_credits, description,
        bundle_type, validity_days, sort_order
      FROM sms_bundles
      WHERE is_active = true
      ORDER BY bundle_type ASC, sort_order ASC, price_ghs ASC
    `,
    sql`
      SELECT 
        t.id, t.reference, t.type, t.amount_ghs, t.credits, t.bonus_credits,
        t.status, t.initiated_at, t.completed_at,
        b.name AS bundle_name
      FROM transactions t
      LEFT JOIN sms_bundles b ON t.bundle_id = b.id
      WHERE t.user_id = ${session.userId}
      ORDER BY t.initiated_at DESC
      LIMIT 20
    `,
    sql`
      SELECT credits_remaining, expires_at
      FROM user_credit_batches
      WHERE user_id = ${session.userId}
        AND credits_remaining > 0
        AND expires_at IS NOT NULL
        AND expires_at > NOW()
      ORDER BY expires_at ASC
      LIMIT 1
    `,
  ])

  const wallet = walletRows[0] ?? {
    balance_ghs: 0,
    sms_credits: 0,
    lifetime_topup_ghs: 0,
  }

  return {
    balanceGhs: Number(wallet.balance_ghs),
    smsCredits: Number(wallet.sms_credits),
    lifetimeTopupGhs: Number(wallet.lifetime_topup_ghs),
    bundles: bundleRows.map((b) => ({
      id: b.id,
      name: b.name,
      credits: b.credits,
      price_ghs: Number(b.price_ghs),
      bonus_credits: b.bonus_credits,
      description: b.description,
      bundle_type: (b.bundle_type ?? "non_expiry") as "non_expiry" | "expiry",
      validity_days: b.validity_days,
      sort_order: b.sort_order,
    })) as WalletBundle[],
    transactions: txRows.map((t) => ({
      id: t.id,
      reference: t.reference,
      type: t.type,
      amount_ghs: Number(t.amount_ghs),
      credits: t.credits,
      bonus_credits: t.bonus_credits,
      status: t.status,
      initiated_at:
        t.initiated_at instanceof Date
          ? t.initiated_at.toISOString()
          : String(t.initiated_at),
      completed_at: t.completed_at
        ? t.completed_at instanceof Date
          ? t.completed_at.toISOString()
          : String(t.completed_at)
        : null,
      bundle_name: t.bundle_name,
    })) as WalletTransaction[],
    expiringSoon:
      expiryRows.length > 0
        ? {
            creditsRemaining: expiryRows[0].credits_remaining,
            expiresAt:
              expiryRows[0].expires_at instanceof Date
                ? expiryRows[0].expires_at.toISOString()
                : String(expiryRows[0].expires_at),
          }
        : null,
  }
}

// ============================================================
// Action — Initialize Topup
// ============================================================

export type InitializeTopupResult = {
  success: boolean
  error?: string
  authorizationUrl?: string
  reference?: string
}

export async function initializeTopupAction(
  amountGhs: number
): Promise<InitializeTopupResult> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  if (!amountGhs || amountGhs < 1) {
    return { success: false, error: "Minimum top-up is GH₵1.00." }
  }

  if (amountGhs > 10000) {
    return { success: false, error: "Maximum single top-up is GH₵10,000." }
  }

  try {
    const [user] = await sql`
      SELECT email FROM users WHERE id = ${session.userId} LIMIT 1
    `
    if (!user) return { success: false, error: "User not found." }

    const paystackFee = estimatePaystackFee(amountGhs)
    const totalPaid = amountGhs + paystackFee + PLATFORM_FEE_GHS

    const reference = `SIGP-${session.userId}-${Date.now()}`

    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = host.startsWith("localhost") ? "http" : "https"
    const callbackUrl = `${protocol}://${host}/dashboard/wallet/verify`

    const result = await paystack.initializeTransaction({
      email: user.email,
      amountPesewas: Math.round(totalPaid * 100),
      reference,
      callbackUrl,
      metadata: {
        user_id: session.userId,
        wallet_credit_ghs: amountGhs,
        paystack_fee_ghs: paystackFee,
        platform_fee_ghs: PLATFORM_FEE_GHS,
      },
    })

    if (!result.status || !result.data) {
      return {
        success: false,
        error: result.message || "Failed to initialize payment.",
      }
    }

    await sql`
      INSERT INTO paystack_intents (
        reference, user_id, amount_paid_ghs, amount_credited_ghs,
        paystack_fee_ghs, platform_fee_ghs, status,
        authorization_url, access_code
      ) VALUES (
        ${reference},
        ${session.userId},
        ${totalPaid},
        ${amountGhs},
        ${paystackFee},
        ${PLATFORM_FEE_GHS},
        'pending',
        ${result.data.authorization_url},
        ${result.data.access_code}
      )
    `

    return {
      success: true,
      authorizationUrl: result.data.authorization_url,
      reference,
    }
  } catch (error) {
    console.error("[wallet] Initialize top-up failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Top-up failed.",
    }
  }
}

// ============================================================
// Action — Verify Payment (with Retry Logic)
// ============================================================

export type VerifyPaymentResult = {
  success: boolean
  error?: string
  amountCredited?: number
  alreadyProcessed?: boolean
}

export async function verifyPaystackPayment(
  reference: string
): Promise<VerifyPaymentResult> {
  if (!reference) {
    return { success: false, error: "Missing reference." }
  }

  try {
    const [intent] = await sql`
      SELECT id, user_id, amount_credited_ghs, status
      FROM paystack_intents
      WHERE reference = ${reference}
      LIMIT 1
    `

    if (!intent) {
      return { success: false, error: "Payment not found." }
    }

    if (intent.status === "success") {
      return {
        success: true,
        amountCredited: Number(intent.amount_credited_ghs),
        alreadyProcessed: true,
      }
    }

    let verification
    let retries = 3

    while (retries > 0) {
      try {
        verification = await paystack.verifyTransaction(reference)
        
        if (verification.data?.status === "success") break
        if (verification.data?.status === "failed" || verification.data?.status === "abandoned") break

        console.log(`[Paystack Verify] Status: ${verification.data?.status}. Retrying...`)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        retries--
      } catch (err) {
        console.error(`[Paystack Verify] Retry ${4 - retries} failed:`, err)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        retries--
      }
    }

    console.log("[Paystack Verify] Final Response:", JSON.stringify(verification, null, 2))

    if (!verification || !verification.status || !verification.data) {
      return {
        success: false,
        error: verification?.message || "Paystack verification failed.",
      }
    }

    const data = verification.data

    if (data.status !== "success") {
      await sql`
        UPDATE paystack_intents
        SET status = ${data.status}, paystack_response = ${JSON.stringify(data)}::jsonb
        WHERE id = ${intent.id}
      `

      try {
        await createNotification({
          userId: intent.user_id,
          type: "error",
          title: "Payment failed",
          body: `Your top-up payment was not completed (status: ${data.status}). No money has been deducted.`,
          link: "/dashboard/wallet",
        })
      } catch (err) {
        console.error("[wallet] Failed to notify payment failure:", err)
      }

      return {
        success: false,
        error: `Payment was not successful (status: ${data.status}).`,
      }
    }

    const amountCredited = Number(intent.amount_credited_ghs)

    await sql`
      UPDATE user_wallets
      SET 
        balance_ghs = balance_ghs + ${amountCredited},
        lifetime_topup_ghs = lifetime_topup_ghs + ${amountCredited},
        updated_at = NOW()
      WHERE user_id = ${intent.user_id}
    `

    await sql`
      INSERT INTO transactions (
        reference, type, user_id, amount_ghs, credits, gateway, status,
        gateway_response, paystack_reference, initiated_at, completed_at
      ) VALUES (
        ${reference},
        'wallet_topup',
        ${intent.user_id},
        ${amountCredited},
        0,
        'paystack',
        'success',
        ${JSON.stringify(data)}::jsonb,
        ${reference},
        NOW(),
        NOW()
      )
      ON CONFLICT (reference) DO NOTHING
    `

    await sql`
      UPDATE paystack_intents
      SET 
        status = 'success',
        paystack_response = ${JSON.stringify(data)}::jsonb,
        verified_at = NOW()
      WHERE id = ${intent.id}
    `

    try {
      await createNotification({
        userId: intent.user_id,
        type: "success",
        title: "Wallet topped up",
        body: `You added GH₵ ${amountCredited.toFixed(2)} to your wallet.`,
        link: "/dashboard/wallet",
      })
    } catch (err) {
      console.error("[wallet] Failed to notify top-up success:", err)
    }

    revalidatePath("/dashboard/wallet")
    revalidatePath("/dashboard")

    return { success: true, amountCredited }
  } catch (error) {
    console.error("[wallet] Verification failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verification failed.",
    }
  }
}

// ============================================================
// Action — Purchase Bundle
// ============================================================

export type PurchaseBundleResult = {
  success: boolean
  error?: string
  creditsAdded?: number
  newBalance?: number
  newCredits?: number
}

export async function purchaseBundleAction(
  bundleId: number
): Promise<PurchaseBundleResult> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    const [bundle] = await sql`
      SELECT id, name, credits, price_ghs, bonus_credits, bundle_type, validity_days, is_active
      FROM sms_bundles
      WHERE id = ${bundleId}
      LIMIT 1
    `

    if (!bundle) return { success: false, error: "Bundle not found." }
    if (!bundle.is_active)
      return { success: false, error: "This bundle is no longer available." }

    const price = Number(bundle.price_ghs)
    const totalCredits = bundle.credits + bundle.bonus_credits

    const [wallet] = await sql`
      SELECT balance_ghs, sms_credits
      FROM user_wallets
      WHERE user_id = ${session.userId}
      LIMIT 1
    `

    if (!wallet || Number(wallet.balance_ghs) < price) {
      return {
        success: false,
        error: `Insufficient wallet balance. You need GH₵${price.toFixed(2)} but have GH₵${Number(wallet?.balance_ghs ?? 0).toFixed(2)}.`,
      }
    }

    let expiresAt: string | null = null
    if (bundle.bundle_type === "expiry" && bundle.validity_days) {
      const d = new Date()
      d.setDate(d.getDate() + bundle.validity_days)
      expiresAt = d.toISOString()
    }

    const reference = `BNDL-${session.userId}-${Date.now()}`

    await sql`
      UPDATE user_wallets
      SET 
        balance_ghs = balance_ghs - ${price},
        sms_credits = sms_credits + ${totalCredits},
        updated_at = NOW()
      WHERE user_id = ${session.userId}
    `

    await sql`
      INSERT INTO user_credit_batches (
        user_id, bundle_id, bundle_name, credits_purchased, credits_remaining, expires_at
      ) VALUES (
        ${session.userId},
        ${bundle.id},
        ${bundle.name},
        ${totalCredits},
        ${totalCredits},
        ${expiresAt}
      )
    `

    await sql`
      INSERT INTO transactions (
        reference, type, user_id, bundle_id, amount_ghs, credits, bonus_credits,
        gateway, status, initiated_at, completed_at
      ) VALUES (
        ${reference},
        'bundle_purchase',
        ${session.userId},
        ${bundle.id},
        ${price},
        ${bundle.credits},
        ${bundle.bonus_credits},
        'internal',
        'success',
        NOW(),
        NOW()
      )
    `

    const [updated] = await sql`
      SELECT balance_ghs, sms_credits FROM user_wallets WHERE user_id = ${session.userId} LIMIT 1
    `

    const newBalance = Number(updated.balance_ghs)
    const newCredits = Number(updated.sms_credits)

    try {
      const bonusText =
        bundle.bonus_credits > 0
          ? ` (${bundle.credits} + ${bundle.bonus_credits} bonus)`
          : ""

      await createNotification({
        userId: session.userId,
        type: "success",
        title: "Bundle purchased",
        body: `${bundle.name} — ${totalCredits.toLocaleString()} credits added${bonusText}.`,
        link: "/dashboard/wallet",
      })

      if (newBalance < LOW_BALANCE_GHS) {
        await createNotification({
          userId: session.userId,
          type: "warning",
          title: "Wallet balance low",
          body: `Your wallet balance is GH₵ ${newBalance.toFixed(2)}. Top up soon to avoid interrupted campaigns.`,
          link: "/dashboard/wallet",
        })
      }

      if (newCredits < LOW_CREDITS) {
        await createNotification({
          userId: session.userId,
          type: "warning",
          title: "SMS credits running low",
          body: `You have ${newCredits.toLocaleString()} credits left. Buy a bundle to keep sending.`,
          link: "/dashboard/wallet",
        })
      }
    } catch (err) {
      console.error("[wallet] Failed to notify bundle purchase:", err)
    }

    revalidatePath("/dashboard/wallet")
    revalidatePath("/dashboard")

    return {
      success: true,
      creditsAdded: totalCredits,
      newBalance,
      newCredits,
    }
  } catch (error) {
    console.error("[wallet] Purchase failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Purchase failed.",
    }
  }
}