"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

// ============================================================
// Types
// ============================================================

export type Contact = {
  id: number
  phone: string
  firstName: string | null
  lastName: string | null
  isActive: boolean
  optedOutAt: string | null
  createdAt: string
  groupIds: number[]
  groupNames: string[]
}

export type ContactFilters = {
  search?: string
  groupId?: number
  status?: "all" | "active" | "opted_out"
  limit?: number
}

export type ContactsStats = {
  total: number
  active: number
  optedOut: number
  ungrouped: number
}

// ============================================================
// Read — list contacts
// ============================================================

export async function listContacts(
  filters: ContactFilters = {}
): Promise<Contact[]> {
  const session = await getSession()
  if (!session) return []

  const limit = Math.min(filters.limit ?? 200, 1000)

  // Base query with group membership aggregation
  const rows = await sql`
    SELECT 
      c.id,
      c.phone,
      c.first_name,
      c.last_name,
      c.is_active,
      c.opted_out_at,
      c.created_at,
      COALESCE(
        ARRAY_AGG(DISTINCT g.id) FILTER (WHERE g.id IS NOT NULL),
        '{}'
      ) AS group_ids,
      COALESCE(
        ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL),
        '{}'
      ) AS group_names
    FROM contacts c
    LEFT JOIN contact_group_members m ON m.contact_id = c.id
    LEFT JOIN contact_groups g ON g.id = m.group_id
    WHERE c.user_id = ${session.userId}
      AND (${filters.search ?? null}::text IS NULL
           OR c.phone ILIKE ${"%" + (filters.search ?? "") + "%"}
           OR c.first_name ILIKE ${"%" + (filters.search ?? "") + "%"}
           OR c.last_name ILIKE ${"%" + (filters.search ?? "") + "%"})
      AND (${filters.status ?? "all"}::text = 'all'
           OR (${filters.status ?? "all"}::text = 'active' AND c.is_active = true)
           OR (${filters.status ?? "all"}::text = 'opted_out' AND c.is_active = false))
      AND (${filters.groupId ?? null}::int IS NULL
           OR EXISTS (
             SELECT 1 FROM contact_group_members mg
             WHERE mg.contact_id = c.id AND mg.group_id = ${filters.groupId ?? null}
           ))
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    id: r.id,
    phone: r.phone,
    firstName: r.first_name,
    lastName: r.last_name,
    isActive: r.is_active,
    optedOutAt:
      r.opted_out_at instanceof Date
        ? r.opted_out_at.toISOString()
        : r.opted_out_at
        ? String(r.opted_out_at)
        : null,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
    groupIds: (r.group_ids as number[]) ?? [],
    groupNames: (r.group_names as string[]) ?? [],
  }))
}

// ============================================================
// Read — stats
// ============================================================

export async function getContactsStats(): Promise<ContactsStats> {
  const session = await getSession()
  const empty: ContactsStats = { total: 0, active: 0, optedOut: 0, ungrouped: 0 }
  if (!session) return empty

  const [row] = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_active = true)::int AS active,
      COUNT(*) FILTER (WHERE is_active = false)::int AS opted_out,
      COUNT(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1 FROM contact_group_members m WHERE m.contact_id = contacts.id
        )
      )::int AS ungrouped
    FROM contacts
    WHERE user_id = ${session.userId}
  `

  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    optedOut: row?.opted_out ?? 0,
    ungrouped: row?.ungrouped ?? 0,
  }
}

// ============================================================
// Create — single contact
// ============================================================

export async function createContactAction(formData: FormData): Promise<{
  success: boolean
  error?: string
  contactId?: number
}> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const rawPhone = (formData.get("phone") as string)?.trim()
  const firstName = (formData.get("firstName") as string)?.trim() || null
  const lastName = (formData.get("lastName") as string)?.trim() || null
  const groupIdRaw = formData.get("groupId") as string
  const groupId = groupIdRaw && groupIdRaw !== "none" ? parseInt(groupIdRaw, 10) : null

  if (!rawPhone) return { success: false, error: "Phone number is required." }

  // Normalize the phone using our helper
  const { normalizePhone } = await import("@/lib/phone")
  const result = normalizePhone(rawPhone)
  if (!result.valid || !result.normalized) {
    return { success: false, error: result.reason || "Invalid phone number." }
  }
  const normalizedPhone = result.normalized

  try {
    // Insert contact (or get existing on conflict)
    const [contact] = await sql`
      INSERT INTO contacts (user_id, phone, first_name, last_name)
      VALUES (${session.userId}, ${normalizedPhone}, ${firstName}, ${lastName})
      ON CONFLICT (user_id, phone) DO UPDATE
        SET first_name = COALESCE(EXCLUDED.first_name, contacts.first_name),
            last_name = COALESCE(EXCLUDED.last_name, contacts.last_name),
            updated_at = NOW()
      RETURNING id
    `

    // Optionally add to group
    if (groupId) {
      await sql`
        INSERT INTO contact_group_members (contact_id, group_id)
        VALUES (${contact.id}, ${groupId})
        ON CONFLICT DO NOTHING
      `
      await recalcGroupCount(groupId)
    }

    revalidatePath("/dashboard/contacts")
    revalidatePath("/dashboard/contacts/groups")

    return { success: true, contactId: contact.id }
  } catch (error) {
    console.error("Create contact failed:", error)
    return { success: false, error: "Failed to create contact." }
  }
}

// ============================================================
// Update — single contact
// ============================================================

export async function updateContactAction(
  contactId: number,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const rawPhone = (formData.get("phone") as string)?.trim()
  const firstName = (formData.get("firstName") as string)?.trim() || null
  const lastName = (formData.get("lastName") as string)?.trim() || null

  if (!rawPhone) return { success: false, error: "Phone number is required." }

  const { normalizePhone } = await import("@/lib/phone")
  const result = normalizePhone(rawPhone)
  if (!result.valid || !result.normalized) {
    return { success: false, error: result.reason || "Invalid phone number." }
  }

  try {
    // Check phone isn't in use by another contact
    const [conflict] = await sql`
      SELECT id FROM contacts
      WHERE user_id = ${session.userId}
        AND phone = ${result.normalized}
        AND id != ${contactId}
      LIMIT 1
    `
    if (conflict) {
      return { success: false, error: "Another contact already uses this phone number." }
    }

    await sql`
      UPDATE contacts
      SET phone = ${result.normalized},
          first_name = ${firstName},
          last_name = ${lastName},
          updated_at = NOW()
      WHERE id = ${contactId} AND user_id = ${session.userId}
    `

    revalidatePath("/dashboard/contacts")
    return { success: true }
  } catch (error) {
    console.error("Update contact failed:", error)
    return { success: false, error: "Failed to update contact." }
  }
}

// ============================================================
// Delete — single contact
// ============================================================

export async function deleteContactAction(
  contactId: number
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    await sql`
      DELETE FROM contacts
      WHERE id = ${contactId} AND user_id = ${session.userId}
    `
    revalidatePath("/dashboard/contacts")
    revalidatePath("/dashboard/contacts/groups")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Delete failed." }
  }
}

// ============================================================
// Toggle opt-out status
// ============================================================

export async function toggleContactOptOutAction(
  contactId: number,
  optOut: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    await sql`
      UPDATE contacts
      SET is_active = ${!optOut},
          opted_out_at = ${optOut ? new Date().toISOString() : null},
          updated_at = NOW()
      WHERE id = ${contactId} AND user_id = ${session.userId}
    `
    revalidatePath("/dashboard/contacts")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Update failed." }
  }
}

// ============================================================
// Bulk delete
// ============================================================

export async function bulkDeleteContactsAction(
  contactIds: number[]
): Promise<{ success: boolean; deleted: number; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, deleted: 0, error: "Not authenticated." }

  if (contactIds.length === 0) {
    return { success: false, deleted: 0, error: "No contacts selected." }
  }

  try {
    const result = await sql`
      DELETE FROM contacts
      WHERE id = ANY(${contactIds}::int[]) AND user_id = ${session.userId}
      RETURNING id
    `
    revalidatePath("/dashboard/contacts")
    return { success: true, deleted: result.length }
  } catch (error) {
    return { success: false, deleted: 0, error: "Bulk delete failed." }
  }
}

// ============================================================
// Helper — recalc a group's cached contact_count
// ============================================================

async function recalcGroupCount(groupId: number): Promise<void> {
  await sql`
    UPDATE contact_groups
    SET contact_count = (
      SELECT COUNT(*) FROM contact_group_members WHERE group_id = ${groupId}
    ),
    updated_at = NOW()
    WHERE id = ${groupId}
  `
}