import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { CampaignsTable } from "@/components/admin/campaigns-table"
import { listCampaigns, getCampaignStats } from "@/app/actions/admin-campaigns"
import { Send, CheckCircle2, XCircle, Zap, Coins } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminCampaignsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name
    FROM admins
    WHERE id = ${session.adminId}
    LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [campaigns, stats] = await Promise.all([listCampaigns(), getCampaignStats()])

  const statCards = [
    {
      label: "Total Campaigns",
      value: stats.totalCampaigns.toLocaleString(),
      icon: Send,
      color: "text-gray-900 dark:text-gray-100",
      bg: "bg-gray-50 dark:bg-gray-800/50",
    },
    {
      label: "Messages Sent",
      value: stats.totalSent.toLocaleString(),
      icon: Zap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Delivered",
      value: stats.totalDelivered.toLocaleString(),
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Failed",
      value: stats.totalFailed.toLocaleString(),
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Delivery Rate",
      value: `${stats.deliveryRate}%`,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Credits Used",
      value: stats.creditsUsed.toLocaleString(),
      icon: Coins,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ]

  return (
    <AdminContent
      admin={{
        fullName: admin.full_name,
        email: admin.email,
        username: admin.username,
      }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Campaigns" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Campaigns
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every SMS blast sent by your customers across the platform.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <div className={`flex size-7 items-center justify-center rounded-md ${stat.bg}`}>
                    <Icon className={`size-3.5 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Table */}
        <CampaignsTable campaigns={campaigns} />
      </div>
    </AdminContent>
  )
}