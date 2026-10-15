"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { exportTableAction } from "@/app/actions/admin-export"
import type { ExportTable } from "@/app/actions/admin-export"
import type { TableStat } from "@/app/actions/admin-export-stats"
import {
  Download,
  Loader2,
  Users,
  CreditCard,
  Send,
  Inbox,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

const iconMap = {
  users: Users,
  transactions: CreditCard,
  campaigns: Send,
  sender_id_requests: Inbox,
}

export function ExportPanel({ stats }: { stats: TableStat[] }) {
  const [busy, setBusy] = React.useState<ExportTable | null>(null)
  const [toast, setToast] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleExport = async (table: ExportTable) => {
    setBusy(table)
    setToast(null)

    const result = await exportTableAction(table)
    setBusy(null)

    if (!result.success || !result.csv || !result.filename) {
      setToast({ type: "error", message: result.error || "Export failed." })
      return
    }

    // Create blob and trigger download
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setToast({
      type: "success",
      message: `Exported ${result.rowCount} row${result.rowCount === 1 ? "" : "s"}.`,
    })
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            toast.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat, i) => {
          const Icon = iconMap[stat.table]
          const isBusy = busy === stat.table

          return (
            <div
              key={`export-${stat.table}-${i}`}
              className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 shrink-0">
                  <Icon className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {stat.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stat.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {stat.rowCount.toLocaleString()} row{stat.rowCount === 1 ? "" : "s"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(stat.table)}
                      disabled={isBusy || stat.rowCount === 0}
                      className="gap-1.5"
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="size-3.5" />
                          Download CSV
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          <strong>Tip:</strong> Run these exports weekly and store them securely. They
          serve as your own off-platform backup of business data.
        </p>
      </div>
    </div>
  )
}