import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import DashboardPage from "@/components/dashboard-content"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const [
    userRows,
    walletRows,
    campaignStatsRows,
    contactsCountRows,
    activityRows,
  ] = await Promise.all([
    sql`
      SELECT 
        username,
        email,
        company_name,
        display_name,
        logo_url,
        role,
        sending_status
      FROM users
      WHERE id = ${session.userId}
      LIMIT 1
    `,

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
        COALESCE(SUM(total_sent), 0)::int AS total_sent,
        COALESCE(SUM(total_delivered), 0)::int AS total_delivered,
        COUNT(*) FILTER (
          WHERE created_at >= DATE_TRUNC('month', NOW())
        )::int AS campaigns_this_month
      FROM sms_campaigns
      WHERE user_id = ${session.userId}
    `,

    sql`
      SELECT 0::int AS total_contacts
    `,

    sql`
      WITH days AS (
        SELECT generate_series(
          (NOW() - INTERVAL '13 days')::date,
          NOW()::date,
          '1 day'
        )::date AS day
      )
      SELECT
        TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(c.total_sent), 0)::int      AS sent,
        COALESCE(SUM(c.total_delivered), 0)::int AS delivered,
        COALESCE(SUM(c.total_failed), 0)::int    AS failed
      FROM days d
      LEFT JOIN sms_campaigns c
        ON c.user_id = ${session.userId}
       AND DATE_TRUNC('day', c.created_at)::date = d.day
      GROUP BY d.day
      ORDER BY d.day ASC
    `,
  ])

  if (userRows.length === 0) {
    redirect("/login")
  }

  const user = userRows[0]
  const wallet = walletRows[0] ?? {
    balance_ghs: 0,
    sms_credits: 0,
    lifetime_topup_ghs: 0,
  }
  const campaignStats = campaignStatsRows[0] ?? {
    total_sent: 0,
    total_delivered: 0,
    campaigns_this_month: 0,
  }
  const contactsCount = contactsCountRows[0]?.total_contacts ?? 0

  const totalSent = Number(campaignStats.total_sent)
  const totalDelivered = Number(campaignStats.total_delivered)
  const deliveryRate =
    totalSent > 0
      ? Math.round((totalDelivered / totalSent) * 1000) / 10
      : 0

  const activity = activityRows.map((r) => ({
    date: String(r.date),
    sent: Number(r.sent),
    delivered: Number(r.delivered),
    failed: Number(r.failed),
  }))

  return (
    <DashboardPage
      user={{
        // userId removed — the server component injects it
        username: user.username,
        email: user.email,
        companyName: user.display_name || user.company_name,
        logoUrl: user.logo_url,
        role: user.role as "user" | "admin",
        sendingStatus: (user.sending_status ?? "active") as
          | "active"
          | "flagged"
          | "suspended",
        wallet: {
          balanceGhs: Number(wallet.balance_ghs),
          smsCredits: Number(wallet.sms_credits),
          lifetimeTopupGhs: Number(wallet.lifetime_topup_ghs),
        },
        stats: {
          totalSent,
          deliveryRate,
          activeCampaigns: Number(campaignStats.campaigns_this_month),
          newContacts: contactsCount,
        },
        activity,
      }}
    />
  )
}