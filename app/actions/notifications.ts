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

// ============================================================
// Create — for users
// ============================================================

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
    console.error("[createNotification] Failed:", error)
  }
}

// ============================================================
// Create — for admins
// ============================================================

export async function createAdminNotification(params: {
  adminId: number
  type: NotificationType
  title: string
  body?: string
  link?: string
}): Promise<void> {
  try {
    await sql`
      INSERT INTO notifications (admin_id, type, title, body, link)
      VALUES (
        ${params.adminId},
        ${params.type},
        ${params.title},
        ${params.body ?? null},
        ${params.link ?? null}
      )
    `
  } catch (error) {
    console.error("[createAdminNotification] Failed:", error)
  }
}

// ============================================================
// Read — users
// ============================================================

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

// ============================================================
// Read — admins
// ============================================================

export async function getAdminNotifications(
  adminId: number,
  limit = 20
): Promise<Notification[]> {
  try {
    const rows = await sql`
      SELECT id, type, title, body, link, read_at, created_at
      FROM notifications
      WHERE admin_id = ${adminId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return rows as Notification[]
  } catch (error) {
    console.error("[getAdminNotifications] Failed:", error)
    return []
  }
}

export async function getAdminUnreadCount(adminId: number): Promise<number> {
  try {
    const [row] = await sql`
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE admin_id = ${adminId} AND read_at IS NULL
    `
    return row?.count ?? 0
  } catch (error) {
    console.error("[getAdminUnreadCount] Failed:", error)
    return 0
  }
}

export async function markAdminNotificationAsRead(
  notificationId: number,
  adminId: number
): Promise<void> {
  try {
    await sql`
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = ${notificationId} AND admin_id = ${adminId}
    `
  } catch (error) {
    console.error("[markAdminNotificationAsRead] Failed:", error)
  }
}

export async function markAllAdminNotificationsAsRead(
  adminId: number
): Promise<void> {
  try {
    await sql`
      UPDATE notifications
      SET read_at = NOW()
      WHERE admin_id = ${adminId} AND read_at IS NULL
    `
  } catch (error) {
    console.error("[markAllAdminNotificationsAsRead] Failed:", error)
  }
}