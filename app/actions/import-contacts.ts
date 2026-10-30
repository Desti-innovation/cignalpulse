"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { normalizePhone } from "@/lib/phone"
import { encryptPhone, hashPhone } from "@/lib/phone-crypto"
import { revalidatePath } from "next/cache"

// ============================================================
// Types
// ============================================================

export type ImportRow = {
  phone: string
  firstName?: string
  lastName?: string
}

export type ImportOptions = {
  addToGroupId?: number | null
  duplicateHandling: "skip" | "update"
}

export type ImportResult = {
  success: boolean
  error?: string
  imported?: number
  skipped?: number
  updated?: number
  invalid?: number
  addedToGroup?: number
}

// ============================================================
// Action — import a batch of contacts
// ============================================================

export async function importContactsAction(
  rows: ImportRow[],
  options: ImportOptions
): Promise<ImportResult> {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated." }

  if (!rows || rows.length === 0) {
    return { success: false, error: "No rows to import." }
  }

  if (rows.length > 10000) {
    return {
      success: false,
      error: "Maximum 10,000 contacts per import. Split your file and try again.",
    }
  }

  let imported = 0
  let skipped = 0
  let updated = 0
  let invalid = 0

  // Validate + normalize rows
  const cleanRows: Array<{
    phone: string
    encrypted: string
    hash: string
    firstName: string | null
    lastName: string | null
  }> = []

  const seenPhones = new Set<string>()

  for (const row of rows) {
    const result = normalizePhone(row.phone)
    if (!result.valid || !result.normalized) {
      invalid++
      continue
    }

    const normalized = result.normalized

    // Dedupe within the file itself
    if (seenPhones.has(normalized)) {
      skipped++
      continue
    }
    seenPhones.add(normalized)

    cleanRows.push({
      phone: normalized,
      encrypted: encryptPhone(normalized),
      hash: hashPhone(normalized),
      firstName: row.firstName?.trim() || null,
      lastName: row.lastName?.trim() || null,
    })
  }

  if (cleanRows.length === 0) {
    return {
      success: false,
      error: `No valid contacts found. ${invalid} invalid number${invalid === 1 ? "" : "s"} skipped.`,
    }
  }

  try {
    // ---- Fetch existing contacts using the HASH ----
    const hashes = cleanRows.map((r) => r.hash)
    const existing = await sql`
      SELECT id, phone_hash FROM contacts
      WHERE user_id = ${session.userId}
        AND phone_hash = ANY(${hashes}::text[])
    `
    
    const existingMap = new Map<string, number>()
    for (const e of existing) {
      existingMap.set(e.phone_hash, e.id)
    }

    // ---- Split into inserts vs updates/skips ----
    const toInsert: typeof cleanRows = []
    const toUpdate: Array<typeof cleanRows[number] & { id: number }> = []

    for (const row of cleanRows) {
      const existingId = existingMap.get(row.hash)
      if (existingId) {
        if (options.duplicateHandling === "update") {
          toUpdate.push({ ...row, id: existingId })
        } else {
          skipped++
        }
      } else {
        toInsert.push(row)
      }
    }

    // ---- Batch insert new contacts ----
    if (toInsert.length > 0) {
      const encryptedPhones = toInsert.map((r) => r.encrypted)
      const hashes = toInsert.map((r) => r.hash)
      const firstNames = toInsert.map((r) => r.firstName)
      const lastNames = toInsert.map((r) => r.lastName)

      await sql`
        INSERT INTO contacts (user_id, phone_encrypted, phone_hash, first_name, last_name)
        SELECT 
          ${session.userId},
          encrypted,
          hash,
          first_name,
          last_name
        FROM unnest(
          ${encryptedPhones}::text[],
          ${hashes}::text[],
          ${firstNames}::text[],
          ${lastNames}::text[]
        ) AS t(encrypted, hash, first_name, last_name)
        ON CONFLICT (user_id, phone_hash) DO NOTHING
      `

      imported = toInsert.length
    }

    // ---- Apply updates ----
    if (toUpdate.length > 0) {
      for (const row of toUpdate) {
        await sql`
          UPDATE contacts
          SET first_name = COALESCE(${row.firstName}, first_name),
              last_name = COALESCE(${row.lastName}, last_name),
              updated_at = NOW()
          WHERE id = ${row.id} AND user_id = ${session.userId}
        `
        updated++
      }
    }

    // ---- Add all imported/updated contacts to the selected group ----
    let addedToGroup = 0
    if (options.addToGroupId) {
      const [group] = await sql`
        SELECT id FROM contact_groups
        WHERE id = ${options.addToGroupId} AND user_id = ${session.userId}
        LIMIT 1
      `

      if (group) {
        const allHashes = cleanRows.map((r) => r.hash)
        
        // Fetch all contact IDs for these hashes
        const contactRows = await sql`
          SELECT id FROM contacts
          WHERE user_id = ${session.userId}
            AND phone_hash = ANY(${allHashes}::text[])
        `

        const contactIds = contactRows.map((c) => c.id)

        if (contactIds.length > 0) {
          const result = await sql`
            INSERT INTO contact_group_members (contact_id, group_id)
            SELECT id, ${options.addToGroupId}
            FROM unnest(${contactIds}::int[]) AS id
            ON CONFLICT DO NOTHING
            RETURNING id
          `
          addedToGroup = result.length

          await sql`
            UPDATE contact_groups
            SET contact_count = (
              SELECT COUNT(*) FROM contact_group_members
              WHERE group_id = ${options.addToGroupId}
            ),
            updated_at = NOW()
            WHERE id = ${options.addToGroupId}
          `
        }
      }
    }

    revalidatePath("/dashboard/contacts")
    revalidatePath("/dashboard/contacts/groups")

    return {
      success: true,
      imported,
      skipped,
      updated,
      invalid,
      addedToGroup,
    }
  } catch (error) {
    console.error("[import-contacts] Failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed.",
    }
  }
}