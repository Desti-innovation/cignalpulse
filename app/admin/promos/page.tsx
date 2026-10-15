import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { PromosTable } from "@/components/admin/promos-table"
import { listPromos } from "@/app/actions/admin-promos"
import { listBundles } from "@/app/actions/admin-bundles"

export const dynamic = "force-dynamic"

export default async function AdminPromosPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [promos, bundles] = await Promise.all([listPromos(), listBundles()])

  return (
    <AdminContent
      admin={{
        fullName: admin.full_name,
        email: admin.email,
        username: admin.username,
      }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Promo Codes" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Promo Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discount codes customers can apply at bundle purchase.
          </p>
        </div>

        <PromosTable promos={promos} bundles={bundles} />
      </div>
    </AdminContent>
  )
}