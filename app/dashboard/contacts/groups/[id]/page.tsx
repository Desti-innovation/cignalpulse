import { redirect, notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import DashboardPage from "@/components/dashboard-content"
import { GroupDetailClient } from "@/components/contacts/group-detail-client"
import { getContactGroup } from "@/app/actions/contact-groups"
import { listContacts } from "@/app/actions/contacts"

export const dynamic = "force-dynamic"

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const groupId = parseInt(id, 10)
  if (isNaN(groupId)) notFound()

  const session = await getSession()
  if (!session) redirect("/login")

  const [userRows, group] = await Promise.all([
    sql`
      SELECT username, email, company_name, display_name, logo_url, role, sending_status
      FROM users
      WHERE id = ${session.userId}
      LIMIT 1
    `,
    getContactGroup(groupId),
  ])

  if (userRows.length === 0) redirect("/login")
  if (!group) notFound()

  const contacts = await listContacts({ groupId, limit: 1000 })

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
          totalSent: 0,
          deliveryRate: 0,
          activeCampaigns: 0,
          newContacts: 0,
        },
      }}
      breadcrumb="Group"
    >
      <GroupDetailClient group={group} contacts={contacts} />
    </DashboardPage>
  )
}