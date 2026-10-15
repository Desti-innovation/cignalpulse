import { redirect, notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import {
  getUserDetail,
  getUserCampaigns,
  getUserTransactions,
  getUserRedFlags,
} from "@/app/actions/admin-user-detail"
import { listCreditAdjustments } from "@/app/actions/admin-credit-adjustments"
import { UserDetailView } from "@/components/admin/user-detail-view"

export const dynamic = "force-dynamic"

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = parseInt(id, 10)
  if (isNaN(userId)) notFound()

  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [user, campaigns, transactions, redFlags, adjustments] = await Promise.all([
    getUserDetail(userId),
    getUserCampaigns(userId, 10),
    getUserTransactions(userId, 10),
    getUserRedFlags(userId),
    listCreditAdjustments(userId, 20),
  ])

  if (!user) notFound()

  return (
    <AdminContent
      admin={{
        fullName: admin.full_name,
        email: admin.email,
        username: admin.username,
      }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "All Users", href: "/admin/users" },
        { label: user.company_name },
      ]}
    >
      <UserDetailView
        user={user}
        campaigns={campaigns}
        transactions={transactions}
        redFlags={redFlags}
        adjustments={adjustments}
      />
    </AdminContent>
  )
}