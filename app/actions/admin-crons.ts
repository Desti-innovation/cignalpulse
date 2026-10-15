"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"

export type CronJob = {
  id: number
  job_key: string
  name: string
  description: string | null
  schedule: string
  last_run_at: string | null
  last_run_status: string | null
  last_run_duration_ms: number | null
  last_run_error: string | null
  next_run_at: string | null
  is_active: boolean
}

export async function listCronJobs(): Promise<CronJob[]> {
  const session = await getAdminSession()
  if (!session) return []

  const rows = await sql`
    SELECT 
      id, job_key, name, description, schedule,
      last_run_at, last_run_status, last_run_duration_ms, last_run_error,
      next_run_at, is_active
    FROM cron_jobs
    ORDER BY name
  `

  return rows.map((r) => ({
    ...r,
    last_run_at: r.last_run_at instanceof Date ? r.last_run_at.toISOString() : r.last_run_at ? String(r.last_run_at) : null,
    next_run_at: r.next_run_at instanceof Date ? r.next_run_at.toISOString() : r.next_run_at ? String(r.next_run_at) : null,
  })) as CronJob[]
}

/**
 * Records a cron run. Call this from the cron endpoint when it starts and finishes.
 * Example usage inside app/api/cron/detect-patterns/route.ts:
 *   await startCronRun('detect-patterns')
 *   ... do work ...
 *   await finishCronRun('detect-patterns', 'success', durationMs)
 */
export async function startCronRun(jobKey: string): Promise<void> {
  await sql`
    UPDATE cron_jobs
    SET last_run_status = 'running', updated_at = NOW()
    WHERE job_key = ${jobKey}
  `
}

export async function finishCronRun(
  jobKey: string,
  status: "success" | "failed",
  durationMs: number,
  error?: string
): Promise<void> {
  await sql`
    UPDATE cron_jobs
    SET 
      last_run_at = NOW(),
      last_run_status = ${status},
      last_run_duration_ms = ${durationMs},
      last_run_error = ${error ?? null},
      updated_at = NOW()
    WHERE job_key = ${jobKey}
  `
}