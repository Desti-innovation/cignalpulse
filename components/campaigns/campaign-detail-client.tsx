"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Users,
  Coins,
  Copy,
  Search,
} from "lucide-react"
import type {
  CampaignDetail,
  CampaignMessage,
} from "@/app/actions/send-sms"

interface Props {
  campaign: CampaignDetail
  messages: CampaignMessage[]
}

export function CampaignDetailClient({ campaign, messages }: Props) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")

  const filtered = messages.filter((m) => {
    if (!search) return true
    return m.recipient.toLowerCase().includes(search.toLowerCase())
  })

  const isScheduled = campaign.status === "scheduled"

  const sentAt = campaign.sentAt
    ? new Date(campaign.sentAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  const scheduledAt = campaign.scheduledAt
    ? new Date(campaign.scheduledAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  const deliveryRate =
    campaign.totalSent > 0
      ? Math.round((campaign.totalDelivered / campaign.totalSent) * 1000) / 10
      : 0

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <ArrowLeft className="size-4" />
          Back to Campaigns
        </Link>
        <Link
  href={`/dashboard/send?fromCampaign=${campaign.id}`}
  className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
>
  <Send className="size-4" />
  {campaign.status === "draft"
    ? "Continue Editing"
    : campaign.status === "scheduled"
    ? "Edit Schedule"
    : campaign.status === "failed"
    ? "Retry"
    : "Send Again"}
</Link>
      </div>

      {/* Header card */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  campaign.status === "sent"
                    ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900"
                    : campaign.status === "scheduled"
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                }`}
              >
                {campaign.status === "sent" && <CheckCircle2 className="size-3" />}
                {campaign.status === "scheduled" && <Clock className="size-3" />}
                {campaign.status.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground font-mono truncate">
                {campaign.campaignId}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              From <strong className="font-mono">{campaign.senderId}</strong>
              {" · "}
              {isScheduled && scheduledAt
                ? `Scheduled for ${scheduledAt}`
                : sentAt
                ? `Sent ${sentAt}`
                : "—"}
            </p>
          </div>
        </div>

        {/* Message preview */}
        <div className="mt-5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            Message
          </p>
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
            {campaign.message}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard
          label="Recipients"
          value={campaign.recipientCount}
          icon={Users}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          label="Delivered"
          value={campaign.totalDelivered}
          icon={CheckCircle2}
          color="text-green-600 dark:text-green-400"
          bg="bg-green-50 dark:bg-green-950/40"
          subtitle={`${deliveryRate}% rate`}
        />
        <StatCard
          label="Failed"
          value={campaign.totalFailed + campaign.totalRejected}
          icon={XCircle}
          color="text-red-600 dark:text-red-400"
          bg="bg-red-50 dark:bg-red-950/40"
        />
        <StatCard
          label="Credits Used"
          value={campaign.creditsUsed}
          icon={Coins}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-50 dark:bg-amber-950/40"
        />
      </div>

      {/* Message list */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Recipients
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {messages.length} message{messages.length === 1 ? "" : "s"} recorded
            </p>
          </div>
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search numbers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {messages.length === 0
                ? "Delivery reports will appear here once the gateway processes them."
                : "No recipients match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Recipient
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Sent
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Delivered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((m, i) => (
                  <tr
                    key={`msg-${m.id}-${i}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      +{m.recipient}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.status === "DELIVERED"
                            ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                            : m.status === "FAILED" || m.status === "REJECTED"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {m.deliveredAt
                        ? new Date(m.deliveredAt).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  subtitle,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  subtitle?: string
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div className={`flex size-7 items-center justify-center rounded-md ${bg}`}>
          <Icon className={`size-3.5 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {value.toLocaleString()}
      </p>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}