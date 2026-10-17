import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { SenderIdRequestsTable } from "@/components/admin/sender-id-requests-table"
import { listSenderIdRequests } from "@/app/actions/admin-sender-ids"

export const dynamic = "force-dynamic"

export default async function SenderIdRequestsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const requests = await listSenderIdRequests()

  return (
    <AdminContent
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Sender ID Requests" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sender ID Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review, submit to the network, and approve Sender ID requests from your customers.
          </p>
        </div>

        {/* The table */}
        <SenderIdRequestsTable requests={requests} />
      </div>
    </AdminContent>
  )
}