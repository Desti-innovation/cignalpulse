import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function seedAdmin() {
  const username = process.argv[2]
  const email = process.argv[3]
  const fullName = process.argv[4]
  const password = process.argv[5]

  if (!username || !email || !fullName || !password) {
    console.error(
      "Usage: npx tsx scripts/seed-admin.ts <username> <email> '<full_name>' <password>"
    )
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Check .env.local")
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 10)

  const existing = await sql`SELECT id FROM admins WHERE username = ${username}`
  if (existing.length > 0) {
    console.error(`❌ Admin "${username}" already exists.`)
    process.exit(1)
  }

  const [admin] = await sql`
    INSERT INTO admins (username, email, password_hash, full_name)
    VALUES (${username}, ${email}, ${hash}, ${fullName})
    RETURNING id, username, email, full_name, created_at
  `

  console.log("✅ Admin created successfully:")
  console.log(admin)
  process.exit(0)
}

seedAdmin().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})