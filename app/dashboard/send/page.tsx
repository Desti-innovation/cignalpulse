import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import DashboardPage from "@/components/dashboard-content"
import { SendPageClient } from "@/components/send/send-page-client"
import {
  getUserSendContext,
  getGroupsForSend,
} from "@/app/actions/send-sms"
import { listUserTemplates } from "@/app/actions/user-templates"
import { getCampaignForReload } from "@/app/actions/campaigns"
import type { MessageTemplate } from "@/components/send/message-composer"

export const dynamic = "force-dynamic"

export default async function SendPage({
  searchParams,
}: {
  searchParams: Promise<{ fromCampaign?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { fromCampaign } = await searchParams
  const campaignId = fromCampaign ? parseInt(fromCampaign, 10) : null

  const [userRows, sendContext, userTemplates, prefill, groups] =
    await Promise.all([
      sql`
        SELECT username, email, company_name, display_name, logo_url, role, sending_status
        FROM users
        WHERE id = ${session.userId}
        LIMIT 1
      `,
      getUserSendContext(),
      listUserTemplates(),
      campaignId && !isNaN(campaignId)
        ? getCampaignForReload(campaignId)
        : Promise.resolve(null),
      getGroupsForSend(),
    ])

  if (userRows.length === 0) redirect("/login")
  if (!sendContext) redirect("/login")

  const user = userRows[0]

  const templates: MessageTemplate[] = userTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    body: t.body,
    channel: "sms",
  }))

  return (
    <DashboardPage
      user={{
        username: user.username,
        email: user.email,
        companyName: user.display_name || user.company_name,
        logoUrl: user.logo_url,
        role: user.role as "user" | "admin",
        sendingStatus: sendContext.sendingStatus,
        wallet: {
          balanceGhs: 0,
          smsCredits: sendContext.smsCredits,
          lifetimeTopupGhs: 0,
        },
        stats: {
          totalSent: 0,
          deliveryRate: 0,
          activeCampaigns: 0,
          newContacts: 0,
        },
      }}
      breadcrumb="Send SMS"
    >
      <SendPageClient
        sendingStatus={sendContext.sendingStatus}
        smsCredits={sendContext.smsCredits}
        approvedSenderIds={sendContext.approvedSenderIds}
        templates={templates}
        batches={sendContext.batches}
        prefill={prefill}
        groups={groups}
      />
    </DashboardPage>
  )
}