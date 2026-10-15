"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"

export type MarginStats = {
  providerCostPerCredit: number
  totalCreditsSold: number
  totalRevenue: number
  totalCost: number
  grossProfit: number
  marginPercent: number
  thisMonthCredits: number
  thisMonthRevenue: number
  thisMonthCost: number
  thisMonthProfit: number
}

export async function getMarginStats(): Promise<MarginStats> {
  const session = await getAdminSession()
  const empty: MarginStats = {
    providerCostPerCredit: 0,
    totalCreditsSold: 0,
    totalRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    marginPercent: 0,
    thisMonthCredits: 0,
    thisMonthRevenue: 0,
    thisMonthCost: 0,
    thisMonthProfit: 0,
  }
  if (!session) return empty

  const [costRow] = await sql`
    SELECT value FROM platform_settings WHERE key = 'provider_cost_per_credit' LIMIT 1
  `
  const providerCost = parseFloat(costRow?.value ?? "0.02")

  const [totals] = await sql`
    SELECT
      COALESCE(SUM(credits + bonus_credits) FILTER (WHERE status = 'success'), 0)::int AS credits,
      COALESCE(SUM(amount_ghs) FILTER (WHERE status = 'success'), 0)::numeric AS revenue
    FROM transactions
    WHERE type = 'bundle_purchase'
  `

  const [monthly] = await sql`
    SELECT
      COALESCE(SUM(credits + bonus_credits) FILTER (WHERE status = 'success'), 0)::int AS credits,
      COALESCE(SUM(amount_ghs) FILTER (WHERE status = 'success'), 0)::numeric AS revenue
    FROM transactions
    WHERE type = 'bundle_purchase'
      AND completed_at >= DATE_TRUNC('month', NOW())
  `

  const totalCredits = totals.credits
  const totalRevenue = Number(totals.revenue)
  const totalCost = totalCredits * providerCost
  const grossProfit = totalRevenue - totalCost
  const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  const mCredits = monthly.credits
  const mRevenue = Number(monthly.revenue)
  const mCost = mCredits * providerCost
  const mProfit = mRevenue - mCost

  return {
    providerCostPerCredit: providerCost,
    totalCreditsSold: totalCredits,
    totalRevenue,
    totalCost,
    grossProfit,
    marginPercent: Math.round(marginPct * 100) / 100,
    thisMonthCredits: mCredits,
    thisMonthRevenue: mRevenue,
    thisMonthCost: mCost,
    thisMonthProfit: mProfit,
  }
}

export type BundleMargin = {
  id: number
  name: string
  credits: number
  bonusCredits: number
  priceGhs: number
  totalCreditsDelivered: number
  costPerBundle: number
  profitPerBundle: number
  marginPercent: number
  isActive: boolean
}

export async function getBundleMargins(): Promise<BundleMargin[]> {
  const session = await getAdminSession()
  if (!session) return []

  const [costRow] = await sql`
    SELECT value FROM platform_settings WHERE key = 'provider_cost_per_credit' LIMIT 1
  `
  const providerCost = parseFloat(costRow?.value ?? "0.02")

  const rows = await sql`
    SELECT id, name, credits, bonus_credits, price_ghs, is_active
    FROM sms_bundles
    ORDER BY sort_order, price_ghs
  `

  return rows.map((b) => {
    const totalCredits = b.credits + b.bonus_credits
    const cost = totalCredits * providerCost
    const price = Number(b.price_ghs)
    const profit = price - cost
    return {
      id: b.id,
      name: b.name,
      credits: b.credits,
      bonusCredits: b.bonus_credits,
      priceGhs: price,
      totalCreditsDelivered: totalCredits,
      costPerBundle: Math.round(cost * 100) / 100,
      profitPerBundle: Math.round(profit * 100) / 100,
      marginPercent: price > 0 ? Math.round((profit / price) * 10000) / 100 : 0,
      isActive: b.is_active,
    }
  })
}