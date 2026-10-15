import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"
import AdminContent from "@/components/admin-content"
import { getMarginStats, getBundleMargins } from "@/app/actions/admin-margin"
import {
  TrendingUp,
  TrendingDown,
  Coins,
  DollarSign,
  Percent,
  Package,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminMarginPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [admin] = await sql`
    SELECT id, username, email, full_name FROM admins WHERE id = ${session.adminId} LIMIT 1
  `
  if (!admin) redirect("/admin/login")

  const [stats, bundles] = await Promise.all([getMarginStats(), getBundleMargins()])

  const statCards = [
    {
      label: "Total Revenue",
      value: `₵${stats.totalRevenue.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      subtitle: `${stats.totalCreditsSold.toLocaleString()} credits sold`,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Provider Cost",
      value: `₵${stats.totalCost.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      subtitle: `₵${stats.providerCostPerCredit}/credit`,
      icon: Coins,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Gross Profit",
      value: `₵${stats.grossProfit.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      subtitle: `${stats.marginPercent}% margin`,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "This Month",
      value: `₵${stats.thisMonthProfit.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
      subtitle: `₵${stats.thisMonthRevenue.toFixed(2)} revenue`,
      icon: Percent,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
  ]

  return (
    <AdminContent
      admin={{ fullName: admin.full_name, email: admin.email, username: admin.username }}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Margin" },
      ]}
    >
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Profit Margin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue vs your wholesale cost from the SMS gateway. Provider cost per credit is
            ₵{stats.providerCostPerCredit}. Update it from{" "}
            <a href="/admin/settings" className="text-blue-600 underline">
              Settings
            </a>
            .
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {s.label}
                  </p>
                  <div className={`flex size-9 items-center justify-center rounded-lg ${s.bg}`}>
                    <Icon className={`size-4 ${s.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.subtitle}</p>
              </div>
            )
          })}
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Package className="size-4 text-blue-600" />
              Margin by Bundle
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Per-bundle profitability breakdown.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Bundle
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Sell Price
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Credits + Bonus
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Cost
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Profit
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Margin %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {bundles.map((b, i) => (
                  <tr key={`bm-${b.id}-${i}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {b.name}
                        </span>
                        {!b.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                      ₵{b.priceGhs.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {b.credits.toLocaleString()}
                      {b.bonusCredits > 0 ? ` + ${b.bonusCredits}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">
                      ₵{b.costPerBundle.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                      ₵{b.profitPerBundle.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                          b.marginPercent >= 30
                            ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                            : b.marginPercent >= 15
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                            : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {b.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminContent>
  )
}