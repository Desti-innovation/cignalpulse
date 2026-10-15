import { getSession } from "@/lib/session"
import DashboardShell from "@/components/dashboard-shell"
import type { ActivityPoint } from "@/components/analytics/activity-chart"

type DashboardUser = {
  username: string
  email: string
  companyName: string
  logoUrl: string | null
  role: "user" | "admin"
  sendingStatus?: "active" | "flagged" | "suspended"
  wallet?: {
    balanceGhs: number
    smsCredits: number
    lifetimeTopupGhs: number
  }
  stats?: {
    totalSent: number
    deliveryRate: number
    activeCampaigns: number
    newContacts: number
  }
  activity?: ActivityPoint[]
}

interface DashboardPageProps {
  user: DashboardUser
  children?: React.ReactNode
  breadcrumb?: string
}

export default async function DashboardPage({
  user,
  children,
  breadcrumb,
}: DashboardPageProps) {
  const session = await getSession()
  const userId = session?.userId ?? 0

  return (
    <DashboardShell user={user} userId={userId} breadcrumb={breadcrumb}>
      {children}
    </DashboardShell>
  )
}