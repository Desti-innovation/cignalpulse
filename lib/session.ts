import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const secretKey = process.env.JWT_SECRET
if (!secretKey) throw new Error("JWT_SECRET is not set")

const encodedKey = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  userId: number
  username: string
  email: string
  role: "user" | "admin"
  firstLogin: boolean
  profileCompleted: boolean   // ← fixed (removed extra space)
  expiresAt: string
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(payload: Omit<SessionPayload, "expiresAt">) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const fullPayload: SessionPayload = {
    ...payload,
    expiresAt: expiresAt.toISOString(),
  }
  const session = await encrypt(fullPayload)

  const cookieStore = await cookies()
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")?.value
  if (!session) return null
  return await decrypt(session)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function updateSession(payload: Partial<SessionPayload>) {
  const current = await getSession()
  if (!current) return

  const updated: SessionPayload = {
    ...current,
    ...payload,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }

  const session = await encrypt(updated)
  const cookieStore = await cookies()
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(updated.expiresAt),
    sameSite: "lax",
    path: "/",
  })
}