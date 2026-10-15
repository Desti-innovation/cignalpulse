"use server"

import { sql } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-session"

export type TableStat = {
  table: "users" | "transactions" | "campaigns" | "sender_id_requests"
  label: string
  description: string
  rowCount: number
}

export async function getTableStats(): Promise<TableStat[]> {
  const session = await getAdminSession()
  if (!session) return []

  const [counts] = await sql`
    SELECT
      (SELECT COUNT(*) FROM users)::int AS user_count,
      (SELECT COUNT(*) FROM transactions)::int AS tx_count,
      (SELECT COUNT(*) FROM sms_campaigns)::int AS campaign_count,
      (SELECT COUNT(*) FROM sender_id_requests)::int AS sender_request_count
  `

  return [
    {
      table: "users",
      label: "Users",
      description: "All customer accounts with wallet balances and Sender IDs.",
      rowCount: counts.user_count,
    },
    {
      table: "transactions",
      label: "Transactions",
      description: "Every wallet top-up and bundle purchase.",
      rowCount: counts.tx_count,
    },
    {
      table: "campaigns",
      label: "SMS Campaigns",
      description: "All campaigns sent, including delivery metrics.",
      rowCount: counts.campaign_count,
    },
    {
      table: "sender_id_requests",
      label: "Sender ID Requests",
      description: "All Sender ID submissions and their statuses.",
      rowCount: counts.sender_request_count,
    },
  ]
}