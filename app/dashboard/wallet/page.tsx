import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import DashboardPage from "@/components/dashboard-content"
import { WalletPageClient } from "@/components/wallet/wallet-page-client"
import { getWalletData } from "@/app/actions/wallet"

export const dynamic = "force-dynamic"

export default async function WalletPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [userRows, walletData] = await Promise.all([
    sql`
      SELECT username, email, company_name, display_name, logo_url, role, sending_status
      FROM users
      WHERE id = ${session.userId}
      LIMIT 1
    `,
    getWalletData(),
  ])

  if (userRows.length === 0) redirect("/login")
  if (!walletData) redirect("/login")

  const user = userRows[0]

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
          balanceGhs: walletData.balanceGhs,
          smsCredits: walletData.smsCredits,
          lifetimeTopupGhs: walletData.lifetimeTopupGhs,
        },
        stats: {
          totalSent: 0,
          deliveryRate: 0,
          activeCampaigns: 0,
          newContacts: 0,
        },
      }}
      breadcrumb="Wallet"
    >
      <WalletPageClient
        initialData={walletData}
      />
    </DashboardPage>
  )
}