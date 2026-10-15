"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreditAdjustmentPanel } from "@/components/admin/credit-adjustment-panel"
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  Send,
  AlertTriangle,
  ShieldCheck,
  Mail,
  Hash,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react"
import type {
  UserDetail,
  UserCampaign,
  UserTransaction,
  UserRedFlag,
} from "@/app/actions/admin-user-detail"
import type { CreditAdjustment } from "@/app/actions/admin-credit-adjustments"

interface Props {
  user: UserDetail
  campaigns: UserCampaign[]
  transactions: UserTransaction[]
  redFlags: UserRedFlag[]
  adjustments: CreditAdjustment[]
}

export function UserDetailView({
  user,
  campaigns,
  transactions,
  redFlags,
  adjustments,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = React.useState<"overview" | "campaigns" | "transactions" | "flags">(
    "overview"
  )

  const displayName = user.display_name || user.company_name
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const created = new Date(user.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const activeFlags = redFlags.filter((f) => f.status === "active")

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Back + actions bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <ArrowLeft className="size-4" />
          Back to All Users
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`/admin/transactions?search=${user.username}`, "_blank")
            }
          >
            <ExternalLink className="size-4 mr-2" />
            View in Transactions
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-5">
          <Avatar className="size-16 rounded-2xl">
            {user.logo_url ? <AvatarImage src={user.logo_url} alt={displayName} /> : null}
            <AvatarFallback className="rounded-2xl bg-blue-600 text-white text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {displayName}
              </h1>
              <StatusBadge active={user.is_active} sendingStatus={user.sending_status} />
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              {user.username}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Joined {created}
              </span>
              {user.sender_id && (
                <span className="flex items-center gap-1.5">
                  <Hash className="size-3.5" />
                  Sender ID: {user.sender_id}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Wallet Balance"
          value={`₵${user.wallet_balance_ghs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          label="SMS Credits"
          value={user.sms_credits.toLocaleString()}
          icon={Send}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-50 dark:bg-purple-950/30"
        />
        <StatCard
          label="Lifetime Top-up"
          value={`₵${user.lifetime_topup_ghs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`}
          icon={CreditCard}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          label="Active Flags"
          value={activeFlags.length.toString()}
          icon={AlertTriangle}
          color={activeFlags.length > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"}
          bg={activeFlags.length > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-gray-50 dark:bg-gray-800/50"}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-6">
          {[
            { key: "overview" as const, label: "Overview" },
            { key: "campaigns" as const, label: `Campaigns (${campaigns.length})` },
            { key: "transactions" as const, label: `Transactions (${transactions.length})` },
            { key: "flags" as const, label: `Red Flags (${redFlags.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============ OVERVIEW TAB — 3 COLUMNS ============ */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Column 1: Account Info */}
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Account Information
            </h2>
            <div className="space-y-3 text-sm">
              <DetailRow label="Role" value={user.role} />
              <DetailRow
                label="Profile"
                value={user.profile_completed ? "Complete" : "Incomplete"}
              />
              <DetailRow
                label="First Login"
                value={user.first_login ? "Pending" : "Done"}
              />
              <DetailRow label="Sender ID Status" value={user.request_status ?? "—"} />
              <DetailRow label="Gateway Status" value={user.gateway_status ?? "—"} />
            </div>
          </div>

          {/* Column 2: Sending Status */}
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Sending Status
            </h2>
            <div
              className={`p-4 rounded-lg border ${
                user.sending_status === "active"
                  ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {user.sending_status === "active" ? (
                  <ShieldCheck className="size-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                )}
                <p
                  className={`font-semibold ${
                    user.sending_status === "active"
                      ? "text-green-800 dark:text-green-200"
                      : "text-amber-800 dark:text-amber-200"
                  }`}
                >
                  {user.sending_status === "active"
                    ? "Sending normally"
                    : user.sending_status === "flagged"
                    ? "Flagged — sending paused"
                    : "Suspended"}
                </p>
              </div>
              {user.sending_status !== "active" && (
                <Link
                  href="/admin/red-flags"
                  className="text-xs text-amber-700 dark:text-amber-300 underline mt-2 inline-block"
                >
                  View in Red Flags
                </Link>
              )}
            </div>
          </div>

          {/* Column 3: Credit Adjustments */}
          <div className="lg:col-span-1">
            <CreditAdjustmentPanel
              userId={user.id}
              currentCredits={user.sms_credits}
              adjustments={adjustments}
            />
          </div>
        </div>
      )}

      {/* ============ CAMPAIGNS TAB ============ */}
      {tab === "campaigns" && (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No campaigns sent yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
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
                    Delivered
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {campaigns.map((c, i) => (
                  <tr key={`c-${c.id}-${i}`}>
                    <td className="px-4 py-3 font-mono text-xs">{c.sender_id}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[280px] truncate">
                      {c.message}
                    </td>
                    <td className="px-4 py-3 text-xs">{c.recipient_count}</td>
                    <td className="px-4 py-3 text-xs text-green-600 dark:text-green-400">
                      {c.total_delivered}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">{c.status}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString("en-GB") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ============ TRANSACTIONS TAB ============ */}
      {tab === "transactions" && (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Reference
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Credits
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map((t, i) => (
                  <tr key={`t-${t.id}-${i}`}>
                    <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate">
                      {t.reference}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">
                      {t.type.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      ₵{t.amount_ghs.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.credits}
                      {t.bonus_credits > 0 ? ` + ${t.bonus_credits} bonus` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">{t.status}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(t.initiated_at).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ============ FLAGS TAB ============ */}
      {tab === "flags" && (
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          {redFlags.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="size-10 text-green-300 dark:text-green-700 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No red flags — clean history.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Reason
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Severity
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Flagged
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {redFlags.map((f, i) => (
                  <tr key={`f-${f.id}-${i}`}>
                    <td className="px-4 py-3 text-xs capitalize">
                      {f.reason.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">{f.severity}</td>
                    <td className="px-4 py-3 text-xs">
                      {f.status === "active" ? (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="text-gray-500">Cleared</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(f.flagged_at).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className={`flex size-9 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`size-4 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ active, sendingStatus }: { active: boolean; sendingStatus: string }) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
        <XCircle className="size-3" />
        Disabled
      </span>
    )
  }
  if (sendingStatus === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900">
        <CheckCircle2 className="size-3" />
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
      <AlertTriangle className="size-3" />
      {sendingStatus === "flagged" ? "Flagged" : "Suspended"}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right capitalize">
        {value}
      </span>
    </div>
  )
}