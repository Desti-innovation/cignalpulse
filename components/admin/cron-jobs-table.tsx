"use client"

import * as React from "react"
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react"
import type { CronJob } from "@/app/actions/admin-crons"

export function CronJobsTable({ jobs }: { jobs: CronJob[] }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      {jobs.length === 0 ? (
        <div className="p-12 text-center">
          <Activity className="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No cron jobs registered yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {jobs.map((job, i) => (
            <CronRow key={`cron-${job.id}-${i}`} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

function CronRow({ job }: { job: CronJob }) {
  const status = job.last_run_status ?? "never"
  const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; icon: React.ReactNode }
  > = {
    success: {
      label: "Healthy",
      color: "text-green-700 dark:text-green-300",
      bg: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900",
      icon: <CheckCircle2 className="size-3" />,
    },
    failed: {
      label: "Failed",
      color: "text-red-700 dark:text-red-300",
      bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900",
      icon: <XCircle className="size-3" />,
    },
    running: {
      label: "Running",
      color: "text-blue-700 dark:text-blue-300",
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900",
      icon: <Loader2 className="size-3 animate-spin" />,
    },
    never: {
      label: "Not Run Yet",
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
      icon: <Clock className="size-3" />,
    },
  }
  const cfg = statusConfig[status] ?? statusConfig.never

  const lastRun = job.last_run_at
    ? new Date(job.last_run_at).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never"

  const duration = job.last_run_duration_ms
    ? `${(job.last_run_duration_ms / 1000).toFixed(1)}s`
    : "—"

  return (
    <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 shrink-0">
            <Activity className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {job.name}
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}
              >
                {cfg.icon}
                {cfg.label}
              </span>
              {!job.is_active && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase font-bold">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {job.job_key}
            </p>
            {job.description && (
              <p className="text-xs text-muted-foreground mt-2">{job.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-right shrink-0">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Schedule
            </p>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
              {job.schedule}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Last Run
            </p>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
              {lastRun}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Duration
            </p>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
              {duration}
            </p>
          </div>
        </div>
      </div>

      {job.last_run_error && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
          <AlertCircle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 dark:text-red-200 font-mono break-all">
            {job.last_run_error}
          </p>
        </div>
      )}
    </div>
  )
}