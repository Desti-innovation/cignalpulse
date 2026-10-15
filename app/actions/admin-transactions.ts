"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import { logAdminAction } from "@/lib/audit"
import { revalidatePath } from "next/cache"

export type TransactionRow = {
  id: number
  reference: string
  type: "wallet_topup" | "bundle_purchase"
  user_id: number
  username: string
  company_name: string
  bundle_name: string | null
  promo_code: string | null
  amount_ghs: number
  original_amount_ghs: number | null
  credits: number
  bonus_credits: number
  gateway: string | null
  status: string
  initiated_at: string
  completed_at: string | null
  refunded_at: string | null
}

export type TransactionFilters = {
  search?: string
  type?: "wallet_topup" | "bundle_purchase"
  status?: string
  limit?: number
}

export async function listTransactions(
  filters: TransactionFilters = {}
): Promise<TransactionRow[]> {
  const session = await getAdminSession()
  if (!session) return []

  const limit = Math.min(filters.limit ?? 200, 500)

  const rows = await sql`
    SELECT 
      t.id, t.reference, t.type, t.user_id,
      u.username, u.company_name,
      b.name AS bundle_name,
      p.code AS promo_code,
      t.amount_ghs, t.original_amount_ghs,
      t.credits, t.bonus_credits,
      t.gateway, t.status,
      t.initiated_at, t.completed_at, t.refunded_at
    FROM transactions t
    INNER JOIN users u ON t.user_id = u.id
    LEFT JOIN sms_bundles b ON t.bundle_id = b.id
    LEFT JOIN promos p ON t.promo_id = p.id
    WHERE 
      (${filters.type ?? null}::text IS NULL OR t.type = ${filters.type ?? null})
      AND (${filters.status ?? null}::text IS NULL OR t.status = ${filters.status ?? null})
      AND (${filters.search ?? null}::text IS NULL OR (
        t.reference ILIKE ${"%" + (filters.search ?? "") + "%"}
        OR u.username ILIKE ${"%" + (filters.search ?? "") + "%"}
        OR u.company_name ILIKE ${"%" + (filters.search ?? "") + "%"}
        OR u.email ILIKE ${"%" + (filters.search ?? "") + "%"}
      ))
    ORDER BY t.initiated_at DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    type: r.type,
    user_id: r.user_id,
    username: r.username,
    company_name: r.company_name,
    bundle_name: r.bundle_name,
    promo_code: r.promo_code,
    amount_ghs: Number(r.amount_ghs),
    original_amount_ghs: r.original_amount_ghs ? Number(r.original_amount_ghs) : null,
    credits: r.credits,
    bonus_credits: r.bonus_credits,
    gateway: r.gateway,
    status: r.status,
    initiated_at: r.initiated_at instanceof Date ? r.initiated_at.toISOString() : String(r.initiated_at),
    completed_at: r.completed_at instanceof Date ? r.completed_at.toISOString() : (r.completed_at ? String(r.completed_at) : null),
    refunded_at: r.refunded_at instanceof Date ? r.refunded_at.toISOString() : (r.refunded_at ? String(r.refunded_at) : null),
  })) as TransactionRow[]
}

export type RevenueOverview = {
  totalRevenueGhs: number
  revenueThisMonthGhs: number
  revenueTodayGhs: number
  pendingTransactions: number
  failedTransactions: number
  refundedGhs: number
  totalCreditsSold: number
  creditsSoldToday: number
  activeWallets: number
  averageTransactionGhs: number
}

export async function getRevenueOverview(): Promise<RevenueOverview> {
  const session = await getAdminSession()
  const empty: RevenueOverview = {
    totalRevenueGhs: 0,
    revenueThisMonthGhs: 0,
    revenueTodayGhs: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    refundedGhs: 0,
    totalCreditsSold: 0,
    creditsSoldToday: 0,
    activeWallets: 0,
    averageTransactionGhs: 0,
  }
  if (!session) return empty

  const [revenueRow] = await sql`
    SELECT
      COALESCE(SUM(amount_ghs) FILTER (WHERE status = 'success'), 0)::numeric AS total_revenue,
      COALESCE(SUM(amount_ghs) FILTER (WHERE status = 'success' AND completed_at >= DATE_TRUNC('month', NOW())), 0)::numeric AS month_revenue,
      COALESCE(SUM(amount_ghs) FILTER (WHERE status = 'success' AND completed_at >= NOW()::date), 0)::numeric AS today_revenue,
      COALESCE(SUM(amount_ghs) FILTER (WHERE status = 'refunded'), 0)::numeric AS refunded,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_count,
      COALESCE(AVG(amount_ghs) FILTER (WHERE status = 'success'), 0)::numeric AS avg_tx
    FROM transactions
    WHERE type = 'wallet_topup'
  `

  const [creditsRow] = await sql`
    SELECT
      COALESCE(SUM(credits + bonus_credits) FILTER (WHERE status = 'success'), 0)::int AS total_credits,
      COALESCE(SUM(credits + bonus_credits) FILTER (WHERE status = 'success' AND completed_at >= NOW()::date), 0)::int AS today_credits
    FROM transactions
    WHERE type = 'bundle_purchase'
  `

  const [walletRow] = await sql`
    SELECT COUNT(*)::int AS active_wallets
    FROM user_wallets
    WHERE balance_ghs > 0 OR sms_credits > 0
  `

  return {
    totalRevenueGhs: Number(revenueRow.total_revenue),
    revenueThisMonthGhs: Number(revenueRow.month_revenue),
    revenueTodayGhs: Number(revenueRow.today_revenue),
    pendingTransactions: revenueRow.pending_count,
    failedTransactions: revenueRow.failed_count,
    refundedGhs: Number(revenueRow.refunded),
    totalCreditsSold: creditsRow.total_credits,
    creditsSoldToday: creditsRow.today_credits,
    activeWallets: walletRow.active_wallets,
    averageTransactionGhs: Math.round(Number(revenueRow.avg_tx) * 100) / 100,
  }
}

export type DailyRevenuePoint = {
  date: string
  walletTopups: number
  bundlePurchases: number
}

export async function getDailyRevenue(days: number = 30): Promise<DailyRevenuePoint[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    WITH date_series AS (
      SELECT generate_series(
        (NOW() - (${days} || ' days')::interval)::date,
        NOW()::date,
        '1 day'::interval
      )::date AS date
    )
    SELECT
      TO_CHAR(ds.date, 'YYYY-MM-DD') AS date,
      COALESCE(SUM(t.amount_ghs) FILTER (WHERE t.type = 'wallet_topup' AND t.status = 'success'), 0)::numeric AS wallet_topups,
      COALESCE(SUM(t.amount_ghs) FILTER (WHERE t.type = 'bundle_purchase' AND t.status = 'success'), 0)::numeric AS bundle_purchases
    FROM date_series ds
    LEFT JOIN transactions t 
      ON DATE_TRUNC('day', t.completed_at)::date = ds.date
    GROUP BY ds.date
    ORDER BY ds.date ASC
  `

  return rows.map((r) => ({
    date: r.date,
    walletTopups: Number(r.wallet_topups),
    bundlePurchases: Number(r.bundle_purchases),
  }))
}

export type TopSpender = {
  userId: number
  companyName: string
  username: string
  totalSpentGhs: number
  transactionCount: number
}

export async function getTopSpenders(limit: number = 5): Promise<TopSpender[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      u.id AS user_id,
      COALESCE(u.display_name, u.company_name) AS company_name,
      u.username,
      COALESCE(SUM(t.amount_ghs) FILTER (WHERE t.status = 'success'), 0)::numeric AS total_spent,
      COUNT(t.id)::int AS tx_count
    FROM users u
    INNER JOIN transactions t ON t.user_id = u.id AND t.type = 'wallet_topup'
    GROUP BY u.id, u.display_name, u.company_name, u.username
    HAVING COALESCE(SUM(t.amount_ghs) FILTER (WHERE t.status = 'success'), 0) > 0
    ORDER BY total_spent DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    userId: r.user_id,
    companyName: r.company_name,
    username: r.username,
    totalSpentGhs: Number(r.total_spent),
    transactionCount: r.tx_count,
  }))
}

export type BundleSalesStat = {
  bundleId: number
  name: string
  unitsSold: number
  revenueGhs: number
  creditsSold: number
}

export async function getBundleSalesStats(): Promise<BundleSalesStat[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      b.id AS bundle_id,
      b.name,
      COUNT(t.id)::int AS units_sold,
      COALESCE(SUM(t.amount_ghs), 0)::numeric AS revenue,
      COALESCE(SUM(t.credits + t.bonus_credits), 0)::int AS credits_sold
    FROM sms_bundles b
    LEFT JOIN transactions t ON t.bundle_id = b.id AND t.status = 'success' AND t.type = 'bundle_purchase'
    GROUP BY b.id, b.name
    ORDER BY revenue DESC
  `

  return rows.map((r) => ({
    bundleId: r.bundle_id,
    name: r.name,
    unitsSold: r.units_sold,
    revenueGhs: Number(r.revenue),
    creditsSold: r.credits_sold,
  }))
}

export async function refundTransactionAction(
  transactionId: number
): Promise<{ success: boolean; error?: string; message?: string }> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const [tx] = await sql`
    SELECT id, reference, user_id, amount_ghs, status, type
    FROM transactions
    WHERE id = ${transactionId}
    LIMIT 1
  `

  if (!tx) return { success: false, error: "Transaction not found." }
  if (tx.status !== "success") {
    return { success: false, error: "Only successful transactions can be refunded." }
  }
  if (tx.type !== "wallet_topup") {
    return { success: false, error: "Only wallet top-ups can be refunded." }
  }

  try {
    // In a real Paystack refund, we'd call Paystack's /refund API here.
    // For now we record it and adjust the wallet.
    await sql`
      UPDATE transactions
      SET status = 'refunded', refunded_at = NOW()
      WHERE id = ${transactionId}
    `

    await sql`
      UPDATE user_wallets
      SET balance_ghs = GREATEST(balance_ghs - ${tx.amount_ghs}, 0),
          updated_at = NOW()
      WHERE user_id = ${tx.user_id}
    `

    await logAdminAction({
      action: "check_sender_id_status",
      targetType: "system",
      metadata: { refundedTransaction: tx.reference, amount: tx.amount_ghs },
    })

    revalidatePath("/admin/revenue")
    revalidatePath("/admin/transactions")
    return { success: true, message: "Transaction marked as refunded." }
  } catch (error) {
    console.error("Refund failed:", error)
    return { success: false, error: "Refund failed." }
  }
}