"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Clock } from "lucide-react"
import type { ScheduledCampaign } from "@/app/actions/admin-scheduled"

export function ScheduledTable({ campaigns }: { campaigns: ScheduledCampaign[] }) {
  const [search, setSearch] = React.useState("")

  const filtered = campaigns.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.company_name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.sender_id.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search scheduled campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Calendar className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {campaigns.length === 0
              ? "No scheduled campaigns right now."
              : "No scheduled campaigns match your search."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Scheduled For
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Sender
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Message
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Recipients
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((c, i) => {
                  const date = new Date(c.scheduled_at)
                  const now = new Date()
                  const isSoon =
                    date.getTime() - now.getTime() < 24 * 60 * 60 * 1000 &&
                    date > now

                  return (
                    <tr
                      key={`sched-${c.id}-${i}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock
                            className={`size-4 ${
                              isSoon ? "text-amber-500" : "text-gray-400"
                            }`}
                          />
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {date.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {date.toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          {isSoon && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                              SOON
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                        {c.company_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {c.sender_id}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[280px] truncate">
                        {c.message}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {c.recipient_count.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}