import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { BundlesTable } from "@/components/admin/bundles-table"
import { listBundles } from "@/app/actions/admin-bundles"

export const dynamic = "force-dynamic"

export default async function AdminBundlesPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const bundles = await listBundles()

  return (
    <AdminContent
      admin={{
        fullName: admin.full_name,
        email: admin.email,
        username: admin.username,
      }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "SMS Bundles" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            SMS Bundles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the bundles your customers buy from their wallet balance.
          </p>
        </div>

        <BundlesTable bundles={bundles} />
      </div>
    </AdminContent>
  )
}