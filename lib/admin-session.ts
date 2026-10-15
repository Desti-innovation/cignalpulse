import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const secretKey = process.env.JWT_SECRET
if (!secretKey) throw new Error("JWT_SECRET is not set")

const encodedKey = new TextEncoder().encode(secretKey + "_admin")

export type AdminSessionPayload = {
  adminId: number
  username: string
  email: string
  fullName: string
  role: "admin"
  expiresAt: string
}

export async function encryptAdmin(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // Shorter — admins re-login daily
    .sign(encodedKey)
}

export async function decryptAdmin(
  session: string | undefined = ""
): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as AdminSessionPayload
  } catch {
    return null
  }
}

export async function createAdminSession(
  payload: Omit<AdminSessionPayload, "expiresAt">
) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const fullPayload: AdminSessionPayload = {
    ...payload,
    expiresAt: expiresAt.toISOString(),
  }
  const session = await encryptAdmin(fullPayload)

  const cookieStore = await cookies()
  cookieStore.set("admin_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")?.value
  if (!session) return null
  return await decryptAdmin(session)
}

export async function deleteAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
}