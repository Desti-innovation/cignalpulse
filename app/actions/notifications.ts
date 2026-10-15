"use server"

import { sql } from "@/lib/db"

export type NotificationType = "info" | "success" | "warning" | "error"

export type Notification = {
  id: number
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

/**
 * Insert a new notification for a user.
 * Call this from any server action where an event happens
 * that the user needs to know about.
 */
export async function createNotification(params: {
  userId: number
  type: NotificationType
  title: string
  body?: string
  link?: string
}): Promise<void> {
  try {
    await sql`
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (
        ${params.userId},
        ${params.type},
        ${params.title},
        ${params.body ?? null},
        ${params.link ?? null}
      )
    `
  } catch (error) {
    // Never let a notification failure break the parent action
    console.error("[createNotification] Failed:", error)
  }
}

/**
 * Fetch the most recent notifications for the current user.
 */
export async function getNotifications(
  userId: number,
  limit = 20
): Promise<Notification[]> {
  try {
    const rows = await sql`
      SELECT id, type, title, body, link, read_at, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return rows as Notification[]
  } catch (error) {
    console.error("[getNotifications] Failed:", error)
    return []
  }
}

/**
 * Count unread notifications — used to drive the red dot on the bell.
 */
export async function getUnreadCount(userId: number): Promise<number> {
  try {
    const [row] = await sql`
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE user_id = ${userId} AND read_at IS NULL
    `
    return row?.count ?? 0
  } catch (error) {
    console.error("[getUnreadCount] Failed:", error)
    return 0
  }
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(
  notificationId: number,
  userId: number
): Promise<void> {
  try {
    await sql`
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = ${notificationId} AND user_id = ${userId}
    `
  } catch (error) {
    console.error("[markAsRead] Failed:", error)
  }
}

/**
 * Mark every unread notification as read for the user.
 */
export async function markAllAsRead(userId: number): Promise<void> {
  try {
    await sql`
      UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = ${userId} AND read_at IS NULL
    `
  } catch (error) {
    console.error("[markAllAsRead] Failed:", error)
  }
}

/**
 * Delete a single notification.
 */
export async function deleteNotification(
  notificationId: number,
  userId: number
): Promise<void> {
  try {
    await sql`
      DELETE FROM notifications
      WHERE id = ${notificationId} AND user_id = ${userId}
    `
  } catch (error) {
    console.error("[deleteNotification] Failed:", error)
  }
}