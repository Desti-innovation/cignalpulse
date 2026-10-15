"use server"

import { sql } from "@/lib/db"
import {
  generateUsername,
  generatePassword,
  hashPassword,
} from "@/lib/generate-credentials"
import { revalidatePath } from "next/cache"

export async function approveSenderIdRequest(requestId: string) {
  try {
    // 1. Find the request
    const requests = await sql`
      SELECT * FROM sender_id_requests 
      WHERE request_id = ${requestId}
      LIMIT 1
    `

    if (requests.length === 0) {
      return { success: false, error: "Request not found." }
    }

    const request = requests[0]

    if (request.status === "approved") {
      return { success: false, error: "This request has already been approved." }
    }

    // 2. Generate credentials
    let username = generateUsername(request.company_name)
    const plainPassword = generatePassword()
    const passwordHash = await hashPassword(plainPassword)

    // 3. Ensure username is unique — append a number if taken
    let suffix = 1
    let finalUsername = username

    while (true) {
      const existing = await sql`
        SELECT id FROM users WHERE username = ${finalUsername} LIMIT 1
      `
      if (existing.length === 0) break
      suffix++
      finalUsername = `${username}${suffix}`
    }
    username = finalUsername

    // 4. Create the user
    const [newUser] = await sql`
      INSERT INTO users (
        username,
        email,
        password_hash,
        company_name,
        role,
        sender_id_request_id,
        is_active,
        first_login
      ) VALUES (
        ${username},
        ${request.email},
        ${passwordHash},
        ${request.company_name},
        'user',
        ${request.id},
        true,
        true
      )
      RETURNING id, username, email
    `

    // 5. Update the request
    await sql`
      UPDATE sender_id_requests
      SET 
        status = 'approved',
        approved_at = NOW(),
        created_user_id = ${newUser.id}
      WHERE id = ${request.id}
    `

    revalidatePath("/sender-id-status")
    revalidatePath("/admin/sender-id-requests")

    // 6. Return the credentials (you'll email these to the user)
    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        plainPassword, // ⚠️ Only shown once — send via email, never store this!
      },
    }
  } catch (error) {
    console.error("Approve Sender ID failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Approval failed.",
    }
  }
}