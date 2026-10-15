import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { UsersTable } from "@/components/admin/users-table"
import { listUsers, getUserStats } from "@/app/actions/admin-users"
import { Users, UserCheck, UserX, AlertCircle, UserCog } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name
    FROM admins
    WHERE id = ${session.adminId}
    LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [users, stats] = await Promise.all([listUsers(), getUserStats()])

  const statCards = [
    {
      label: "Total Users",
      value: stats.total,
      icon: Users,
      color: "text-gray-900 dark:text-gray-100",
      bg: "bg-gray-50 dark:bg-gray-800/50",
    },
    {
      label: "Active",
      value: stats.active,
      icon: UserCheck,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Disabled",
      value: stats.inactive,
      icon: UserX,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Pending Password Change",
      value: stats.firstLoginPending,
      icon: AlertCircle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Profile Incomplete",
      value: stats.profileIncomplete,
      icon: UserCog,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
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
        { label: "All Users" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            All Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every customer account created via approved Sender ID requests.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <div className={`flex size-8 items-center justify-center rounded-lg ${stat.bg}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Table */}
        <UsersTable users={users} />
      </div>
    </AdminContent>
  )
}