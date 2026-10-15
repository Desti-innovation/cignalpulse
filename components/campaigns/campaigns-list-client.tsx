"use client"

import * as React from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import type { CampaignRow, CampaignsStats } from "@/app/actions/campaigns"
import {
  Search,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Coins,
  TrendingUp,
  FileText,
  ArrowRight,
  Calendar,
  Pencil,
} from "lucide-react"

// ============================================================
// Props
// ============================================================

interface Props {
  campaigns: CampaignRow[]
  stats: CampaignsStats
  pageTitle?: string
  pageDescription?: string
  emptyStateType?: "all" | "scheduled" | "drafts"
  hideFilters?: boolean
}

// ============================================================
// Component
// ============================================================

export function CampaignsListClient({
  campaigns,
  stats,
  pageTitle = "Campaigns",
  pageDescription = "Every SMS blast you've sent, with delivery status.",
  emptyStateType = "all",
  hideFilters = false,
}: Props) {
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "sent" | "scheduled" | "draft">("all")

  const filtered = campaigns.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.campaignId.toLowerCase().includes(q) ||
      c.senderId.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* Desktop header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{pageDescription}</p>
        </div>
        <Link
          href="/dashboard/send"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="size-4" />
          New Campaign
        </Link>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {pageTitle}
          </h2>
          <p className="text-xs text-muted-foreground">
            {campaigns.length} total
          </p>
        </div>
        <Link
          href="/dashboard/send"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
        >
          <Plus className="size-3.5" />
          New
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Campaigns"
          value={stats.totalCampaigns}
          icon={Send}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          label="Messages Sent"
          value={stats.totalSent}
          icon={Users}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-50 dark:bg-purple-950/40"
        />
        <StatCard
          label="Delivered"
          value={stats.totalDelivered}
          icon={CheckCircle2}
          color="text-green-600 dark:text-green-400"
          bg="bg-green-50 dark:bg-green-950/40"
        />
        <StatCard
          label="Delivery Rate"
          value={stats.deliveryRate}
          suffix="%"
          icon={TrendingUp}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/40"
        />
      </div>

      {/* Toolbar */}
      {campaigns.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {!hideFilters && (
            <div className="flex items-center gap-2">
              {(["all", "sent", "scheduled", "draft"] as const).map((f) => {
                const count =
                  f === "all"
                    ? campaigns.length
                    : campaigns.filter((c) => c.status === f).length
                if (f !== "all" && count === 0) return null
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`
                      flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                      ${
                        filter === f
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    {f === "draft" ? "drafts" : f}
                    {f !== "all" && (
                      <span className="ml-1.5 opacity-70">{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Campaigns */}
      {campaigns.length === 0 ? (
        <EmptyState type={emptyStateType} />
      ) : filtered.length === 0 ? (
        <NoResults search={search} onClear={() => setSearch("")} />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((c) => (
              <MobileCampaignCard key={`mc-${c.id}`} campaign={c} />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                      Sender
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                      Message
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                      Recipients
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                      Delivery
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                      Date
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((c, i) => {
                    const deliveryPct =
                      c.totalSent > 0
                        ? Math.round((c.totalDelivered / c.totalSent) * 100)
                        : 0

                    return (
                      <tr
                        key={`c-${c.id}-${i}`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                          {c.senderId || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[260px] truncate">
                          {c.message}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                          {c.recipientCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${deliveryPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {deliveryPct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(c)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/campaigns/${c.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View
                            <ArrowRight className="size-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: number
  suffix?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div
          className={`flex size-7 md:size-8 items-center justify-center rounded-lg ${bg}`}
        >
          <Icon className={`size-3.5 md:size-4 ${color}`} />
        </div>
      </div>
      <p className={`text-xl md:text-2xl font-bold ${color}`}>
        {value.toLocaleString()}
        {suffix}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    sent: {
      label: "Sent",
      cls: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900",
      icon: <CheckCircle2 className="size-3" />,
    },
    scheduled: {
      label: "Scheduled",
      cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
      icon: <Clock className="size-3" />,
    },
    draft: {
      label: "Draft",
      cls: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      icon: <Pencil className="size-3" />,
    },
    failed: {
      label: "Failed",
      cls: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
      icon: <XCircle className="size-3" />,
    },
  }
  const cfg = config[status] ?? config.sent
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function MobileCampaignCard({ campaign: c }: { campaign: CampaignRow }) {
  const deliveryPct =
    c.totalSent > 0 ? Math.round((c.totalDelivered / c.totalSent) * 100) : 0
  const isScheduled = c.status === "scheduled"
  const isDraft = c.status === "draft"

  return (
    <Link
      href={`/dashboard/campaigns/${c.id}`}
      className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 hover:border-blue-300 dark:hover:border-blue-900 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={c.status} />
            {c.senderId && (
              <span className="text-[10px] text-muted-foreground font-mono truncate">
                {c.senderId}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="size-4 text-gray-400 shrink-0 mt-0.5" />
      </div>

      {/* Message preview */}
      <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-3">
        {c.message || <span className="italic text-muted-foreground">No message yet</span>}
      </p>

      {/* Stats row */}
      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            {c.recipientCount.toLocaleString()}
          </span>
          {!isScheduled && !isDraft && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3 text-green-500" />
              {deliveryPct}%
            </span>
          )}
          {!isDraft && (
            <span className="inline-flex items-center gap-1">
              <Coins className="size-3" />
              {c.creditsUsed.toLocaleString()}
            </span>
          )}
        </div>
        <span className="whitespace-nowrap">{formatDate(c)}</span>
      </div>
    </Link>
  )
}

function EmptyState({ type }: { type: "all" | "scheduled" | "drafts" }) {
  const config = {
    all: {
      icon: FileText,
      title: "No campaigns yet",
      description:
        "When you send your first SMS, it'll appear here with delivery stats.",
      ctaLabel: "Send Your First SMS",
    },
    scheduled: {
      icon: Calendar,
      title: "No scheduled campaigns",
      description:
        "When you schedule an SMS for later, it'll appear here so you can review or cancel it.",
      ctaLabel: "Schedule an SMS",
    },
    drafts: {
      icon: Pencil,
      title: "No draft campaigns",
      description:
        "Drafts let you save a message in progress. When you save one, it'll appear here.",
      ctaLabel: "Create a Draft",
    },
  }[type]

  const Icon = config.icon

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-10 md:p-16 text-center">
      <div className="flex size-14 md:size-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 mx-auto mb-5">
        <Icon className="size-7 md:size-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
        {config.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        {config.description}
      </p>
      <Link
        href="/dashboard/send"
        className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
      >
        <Send className="size-4" />
        {config.ctaLabel}
      </Link>
    </div>
  )
}

function NoResults({ search, onClear }: { search: string; onClear: () => void }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-10 text-center">
      <Search className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground mb-4">
        No campaigns match <strong>&quot;{search}&quot;</strong>
      </p>
      <button
        onClick={onClear}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        Clear search
      </button>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function formatDate(c: CampaignRow): string {
  if (c.status === "scheduled" && c.scheduledAt) {
    return new Date(c.scheduledAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })
  }
  if (c.sentAt) {
    return new Date(c.sentAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }
  return new Date(c.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
}