import { redirect, notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { SenderIdDetailView } from "@/components/admin/sender-id-detail-view"
import {
  getSenderIdRequestDetail,
  getGatewayLogs,
} from "@/app/actions/admin-sender-id-detail"

export const dynamic = "force-dynamic"

export default async function SenderIdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const requestDbId = parseInt(id, 10)
  if (isNaN(requestDbId)) notFound()

  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name
    FROM admins
    WHERE id = ${session.adminId}
    LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [request, logs] = await Promise.all([
    getSenderIdRequestDetail(requestDbId),
    getGatewayLogs(requestDbId),
  ])

  if (!request) notFound()

  return (
    <AdminContent
      admin={{
        fullName: admin.full_name,
        email: admin.email,
        username: admin.username,
      }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Sender ID Requests", href: "/admin/sender-ids" },
        { label: request.sender_id },
      ]}
    >
      <SenderIdDetailView request={request} logs={logs} />
    </AdminContent>
  )
}