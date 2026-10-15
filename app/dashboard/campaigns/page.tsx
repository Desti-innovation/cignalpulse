import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import DashboardPage from "@/components/dashboard-content"
import { CampaignsListClient } from "@/components/campaigns/campaigns-list-client"
import {
  listUserCampaigns,
  getUserCampaignStats,
} from "@/app/actions/campaigns"

export const dynamic = "force-dynamic"

export default async function CampaignsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [userRows, campaigns, stats] = await Promise.all([
    sql`
      SELECT username, email, company_name, display_name, logo_url, role, sending_status
      FROM users
      WHERE id = ${session.userId}
      LIMIT 1
    `,
    // listUserCampaigns(100),
        listUserCampaigns({ limit: 100 }),
    getUserCampaignStats(),
  ])

  if (userRows.length === 0) redirect("/login")

  const user = userRows[0]

  const [wallet] = await sql`
    SELECT sms_credits FROM user_wallets WHERE user_id = ${session.userId} LIMIT 1
  `

  return (
    <DashboardPage
      user={{
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
          balanceGhs: 0,
          smsCredits: wallet?.sms_credits ?? 0,
          lifetimeTopupGhs: 0,
        },
        stats: {
          totalSent: stats.totalSent,
          deliveryRate: stats.deliveryRate,
          activeCampaigns: stats.thisMonthCount,
          newContacts: 0,
        },
      }}
      breadcrumb="Campaigns"
    >
      <CampaignsListClient campaigns={campaigns} stats={stats} />
    </DashboardPage>
  )
}