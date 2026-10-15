import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role")

  const cookieStore = await cookies()

  if (role === "admin") {
    cookieStore.delete("admin_session")
  } else {
    cookieStore.delete("session")
  }

  return NextResponse.json({ ok: true })
}