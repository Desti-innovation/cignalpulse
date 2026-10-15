import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { TransactionsTable } from "@/components/admin/transactions-table"
import { listTransactions } from "@/app/actions/admin-transactions"

export const dynamic = "force-dynamic"

export default async function AdminTransactionsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const transactions = await listTransactions({ limit: 200 })

  return (
    <AdminContent
      admin={{
        fullName: admin.full_name,
        email: admin.email,
        username: admin.username,
      }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Transactions" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every wallet top-up and internal bundle purchase across all customers.
          </p>
        </div>

        <TransactionsTable transactions={transactions} />
      </div>
    </AdminContent>
  )
}