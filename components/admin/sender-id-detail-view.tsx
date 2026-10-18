"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Eye,
  MoreHorizontal,
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  FileText,
  Calendar,
  Hash,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
} from "lucide-react"
import type {
  SenderIdRequestDetail,
  GatewayLog,
} from "@/app/actions/admin-sender-id-detail"
import {
  submitToGatewayAction,
  checkGatewayStatusAction,
  approveForUserAction,
  rejectRequestAction,
} from "@/app/actions/admin-sender-ids"

interface Props {
  request: SenderIdRequestDetail
  logs: GatewayLog[]
}

function statusConfig(status: string) {
  const map: Record<
    string,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    pending: {
      label: "Pending Review",
      cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
      icon: <Clock className="size-3.5" />,
    },
    submitted: {
      label: "Submitted to Network",
      cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
      icon: <Send className="size-3.5" />,
    },
    approved: {
      label: "Approved",
      cls: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900",
      icon: <CheckCircle2 className="size-3.5" />,
    },
    rejected: {
      label: "Rejected",
      cls: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
      icon: <XCircle className="size-3.5" />,
    },
  }
  return map[status] ?? map.pending
}

function actionIcon(action: string) {
  const size = "size-3.5"
  if (action === "submit") return <Send className={`${size} text-blue-500`} />
  if (action === "status_check") return <RefreshCw className={`${size} text-amber-500`} />
  if (action === "approve") return <ShieldCheck className={`${size} text-green-500`} />
  if (action === "reject") return <ShieldAlert className={`${size} text-red-500`} />
  return <MessageSquare className={`${size} text-gray-400`} />
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    submit: "Submitted to Gateway",
    status_check: "Status Check",
    approve: "Approved for User",
    reject: "Rejected",
  }
  return map[action] ?? action
}

export function SenderIdDetailView({ request, logs }: Props) {
  const router = useRouter()
  const [busy, setBusy] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [credentials, setCredentials] = React.useState<{
    username: string
    password: string
  } | null>(null)
  const [selectedLog, setSelectedLog] = React.useState<GatewayLog | null>(null)

  // State for the editable fields
  const [editedSenderId, setEditedSenderId] = React.useState(request.sender_id)
  const [editedUseCase, setEditedUseCase] = React.useState(request.use_case)

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const isResolved = request.status === "approved" || request.status === "rejected"
  const st = statusConfig(request.status)

  const submittedAt = new Date(request.submitted_at).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const runAction = async (
    key: string,
    fn: () => Promise<{ success: boolean; message?: string; error?: string }>
  ) => {
    setBusy(key)
    setToast(null)
    const result = await fn()
    setBusy(null)

    if (!result.success) {
      setToast({ type: "error", message: result.error || "Action failed." })
      return
    }

    if (result.message && result.message.startsWith("User created:")) {
      const match = result.message.match(
        /User created:\s*(\S+)\s*\(password:\s*(\S+)\)/
      )
      if (match) {
        setCredentials({ username: match[1], password: match[2] })
      }
    } else {
      setToast({ type: "success", message: result.message || "Success." })
    }

    router.refresh()
  }

  // Custom handler for the edit-and-submit flow
  const handleSubmitToNetwork = async () => {
    await runAction("submit", () =>
      submitToGatewayAction(request.id, editedSenderId, editedUseCase)
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Back bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/sender-ids"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <ArrowLeft className="size-4" />
          Back to Sender ID Requests
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                className="gap-2"
              />
            }
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
            Actions
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={busy !== null}
              onClick={() =>
                runAction("check", () => checkGatewayStatusAction(request.id))
              }
            >
              <RefreshCw className="size-4" />
              Check Network Status
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer text-green-600 dark:text-green-400 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-950/50"
              disabled={busy !== null || isResolved}
              onClick={() =>
                runAction("approve", () => approveForUserAction(request.id))
              }
            >
              <CheckCircle2 className="size-4" />
              Approve for User
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50"
              disabled={busy !== null || isResolved}
              onClick={() =>
                runAction("reject", () => rejectRequestAction(request.id))
              }
            >
              <XCircle className="size-4" />
              Reject Request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Toast */}
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

      {/* Header card */}
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-xs font-mono text-muted-foreground">
                {request.request_id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${st.cls}`}
              >
                {st.icon}
                {st.label}
              </span>
              {request.gateway_status && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  Gateway: {request.gateway_status}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {request.sender_id}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Submitted {submittedAt}
            </p>
          </div>
        </div>
      </div>

      {/* Editable Submit Form (Only for Pending) */}
      {request.status === "pending" && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-6">
          <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
            Review Before Submitting
          </h2>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-5">
            Verify the Sender ID and Use Case. You can edit them below before sending to mNotify.
          </p>

          <div className="grid gap-4 max-w-lg">
            <div>
              <Label className="text-blue-900 dark:text-blue-100">Sender ID</Label>
              <Input 
                value={editedSenderId}
                onChange={(e) => setEditedSenderId(e.target.value)}
                className="mt-1 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <Label className="text-blue-900 dark:text-blue-100">Use Case / Purpose</Label>
              <Input 
                value={editedUseCase}
                onChange={(e) => setEditedUseCase(e.target.value)}
                className="mt-1 bg-white dark:bg-gray-900"
              />
            </div>

            <Button 
              onClick={handleSubmitToNetwork} 
              disabled={busy !== null}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2 h-11"
            >
              {busy === "submit" ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Send className="size-4 mr-2" />
              )}
              Save & Submit to Network
            </Button>
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-5">
            Request Details
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <InfoRow
              icon={<Building2 className="size-4" />}
              label="Company Name"
              value={request.company_name}
            />
            <InfoRow
              icon={<Mail className="size-4" />}
              label="Contact Email"
              value={request.email}
            />
            <InfoRow
              icon={<Phone className="size-4" />}
              label="Contact Phone"
              value={request.phone}
            />
            <InfoRow
              icon={<Globe className="size-4" />}
              label="Website"
              value={request.website || "N/A"}
              link={request.website || undefined}
            />
            <InfoRow
              icon={<FileText className="size-4" />}
              label="Primary Use Case"
              value={request.use_case}
              capitalize
            />
            <InfoRow
              icon={<Calendar className="size-4" />}
              label="Submitted"
              value={new Date(request.submitted_at).toLocaleDateString("en-GB")}
            />
          </div>

          {request.notes && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-muted-foreground mb-2">Additional Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {request.notes}
              </p>
            </div>
          )}
        </div>

        {/* Timeline / status */}
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-5">
            Timeline
          </h2>
          <div className="space-y-4">
            <TimelineItem
              label="Request submitted"
              date={request.submitted_at}
              done
            />
            <TimelineItem
              label="Submitted to gateway"
              date={request.reviewed_at ?? undefined}
              done={Boolean(request.reviewed_at)}
            />
            <TimelineItem
              label="Approved"
              date={request.approved_at ?? undefined}
              done={Boolean(request.approved_at)}
            />
            {request.created_user_id && (
              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-muted-foreground mb-2">
                  User Account Created
                </p>
                <Link
                  href={`/admin/users/${request.created_user_id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <User className="size-4" />
                  <span className="font-mono">{request.created_user_username}</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gateway logs */}
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Hash className="size-4 text-blue-600" />
            Gateway Interactions
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Full audit trail of every network call for this request.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No gateway interactions yet. Submit the request to record one.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log, i) => (
              <div
                key={`log-${log.id}-${i}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                  {actionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {actionLabel(log.action)}
                    </p>
                    {log.gateway_status && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold">
                        {log.gateway_status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {log.admin_username ? `by ${log.admin_username} • ` : ""}
                    {new Date(log.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {log.response_payload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedLog(log)}
                    className="size-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <Eye className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credentials modal */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              User Created Successfully
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Copy these credentials now. The password will not be shown again.
            </p>

            <div className="space-y-3 mb-5">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                  {credentials.username}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                  {credentials.password}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCredentials(null)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Username: ${credentials.username}\nPassword: ${credentials.password}`
                  )
                  setCredentials(null)
                }}
              >
                Copy & Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Log detail modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {actionLabel(selectedLog.action)}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(selectedLog.created_at).toLocaleString("en-GB")}
                  {selectedLog.admin_username && ` • by ${selectedLog.admin_username}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>

            <pre className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 text-xs overflow-x-auto">
              {JSON.stringify(selectedLog.response_payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  link,
  capitalize,
}: {
  icon: React.ReactNode
  label: string
  value: string
  link?: string
  capitalize?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {link ? (
          <a
            href={link.startsWith("http") ? link : `https://${link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p
            className={`text-sm font-medium text-gray-900 dark:text-gray-100 truncate ${
              capitalize ? "capitalize" : ""
            }`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

function TimelineItem({
  label,
  date,
  done,
}: {
  label: string
  date?: string
  done: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex size-6 items-center justify-center rounded-full shrink-0 mt-0.5 ${
          done
            ? "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-400"
        }`}
      >
        {done ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
      </div>
      <div>
        <p
          className={`text-sm ${
            done
              ? "font-medium text-gray-900 dark:text-gray-100"
              : "text-gray-400 dark:text-gray-600"
          }`}
        >
          {label}
        </p>
        {date && (
          <p className="text-[10px] text-muted-foreground">
            {new Date(date).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  )
}