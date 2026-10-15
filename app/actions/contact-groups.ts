"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

// ============================================================
// Types
// ============================================================

export type ContactGroup = {
  id: number
  name: string
  description: string | null
  contactCount: number
  createdAt: string
}

// ============================================================
// Read — list groups
// ============================================================

export async function listContactGroups(): Promise<ContactGroup[]> {
  const session = await getSession()
  if (!session) return []

  const rows = await sql`
    SELECT id, name, description, contact_count, created_at
    FROM contact_groups
    WHERE user_id = ${session.userId}
    ORDER BY name ASC
  `

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    contactCount: r.contact_count,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  }))
}

// ============================================================
// Read — single group
// ============================================================

export async function getContactGroup(groupId: number): Promise<ContactGroup | null> {
  const session = await getSession()
  if (!session) return null

  const [row] = await sql`
    SELECT id, name, description, contact_count, created_at
    FROM contact_groups
    WHERE id = ${groupId} AND user_id = ${session.userId}
    LIMIT 1
  `

  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    contactCount: row.contact_count,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }
}

// ============================================================
// Create group
// ============================================================

export async function createContactGroupAction(formData: FormData): Promise<{
  success: boolean
  error?: string
  groupId?: number
}> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null

  if (!name || name.length < 2) {
    return { success: false, error: "Group name is required (at least 2 characters)." }
  }

  try {
    const [group] = await sql`
      INSERT INTO contact_groups (user_id, name, description)
      VALUES (${session.userId}, ${name}, ${description})
      RETURNING id
    `

    revalidatePath("/dashboard/contacts")
    revalidatePath("/dashboard/contacts/groups")

    return { success: true, groupId: group.id }
  } catch (error: unknown) {
    // Handle unique constraint
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return { success: false, error: `A group named "${name}" already exists.` }
    }
    console.error("Create group failed:", error)
    return { success: false, error: "Failed to create group." }
  }
}

// ============================================================
// Update group
// ============================================================

export async function updateContactGroupAction(
  groupId: number,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null

  if (!name || name.length < 2) {
    return { success: false, error: "Group name is required." }
  }

  try {
    await sql`
      UPDATE contact_groups
      SET name = ${name}, description = ${description}, updated_at = NOW()
      WHERE id = ${groupId} AND user_id = ${session.userId}
    `
    revalidatePath("/dashboard/contacts/groups")
    revalidatePath(`/dashboard/contacts/groups/${groupId}`)
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return { success: false, error: `A group named "${name}" already exists.` }
    }
    return { success: false, error: "Update failed." }
  }
}

// ============================================================
// Delete group
// ============================================================

export async function deleteContactGroupAction(
  groupId: number
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    // Group deletion cascades to contact_group_members automatically
    await sql`
      DELETE FROM contact_groups
      WHERE id = ${groupId} AND user_id = ${session.userId}
    `
    revalidatePath("/dashboard/contacts")
    revalidatePath("/dashboard/contacts/groups")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Delete failed." }
  }
}

// ============================================================
// Add contacts to a group (bulk)
// ============================================================

export async function addContactsToGroupAction(
  groupId: number,
  contactIds: number[]
): Promise<{ success: boolean; added: number; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, added: 0, error: "Not authenticated." }

  if (contactIds.length === 0) {
    return { success: false, added: 0, error: "No contacts selected." }
  }

  try {
    // Verify the group belongs to the user
    const [group] = await sql`
      SELECT id FROM contact_groups WHERE id = ${groupId} AND user_id = ${session.userId} LIMIT 1
    `
    if (!group) return { success: false, added: 0, error: "Group not found." }

    // Insert memberships (ignore dupes)
    let added = 0
    for (const contactId of contactIds) {
      const result = await sql`
        INSERT INTO contact_group_members (contact_id, group_id)
        SELECT ${contactId}, ${groupId}
        WHERE EXISTS (
          SELECT 1 FROM contacts WHERE id = ${contactId} AND user_id = ${session.userId}
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `
      if (result.length > 0) added++
    }

    // Recalc count
    await recalcGroupCount(groupId)

    revalidatePath("/dashboard/contacts")
    revalidatePath("/dashboard/contacts/groups")
    revalidatePath(`/dashboard/contacts/groups/${groupId}`)

    return { success: true, added }
  } catch (error) {
    console.error("Add contacts to group failed:", error)
    return { success: false, added: 0, error: "Failed to add contacts." }
  }
}

// ============================================================
// Remove contact from group
// ============================================================

export async function removeContactFromGroupAction(
  groupId: number,
  contactId: number
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  try {
    await sql`
      DELETE FROM contact_group_members
      WHERE group_id = ${groupId}
        AND contact_id = ${contactId}
        AND EXISTS (
          SELECT 1 FROM contact_groups
          WHERE id = ${groupId} AND user_id = ${session.userId}
        )
    `

    await recalcGroupCount(groupId)

    revalidatePath(`/dashboard/contacts/groups/${groupId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Remove failed." }
  }
}

// ============================================================
// Helper
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