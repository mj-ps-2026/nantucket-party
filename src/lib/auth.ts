import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { v4 as uuid } from "uuid"

const SESSION_COOKIE = "admin_session"
const SESSION_EXPIRY = 1000 * 60 * 60 * 24 // 24 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD_HASH
  if (!secret) throw new Error("SESSION_SECRET or ADMIN_PASSWORD_HASH must be set")
  return secret
}

function encode(token: string, expiry: number): string {
  const data = `${token}:${expiry}`
  const buf = Buffer.from(data)
  return buf.toString("base64url")
}

function decode(encoded: string): { token: string; expiry: number } | null {
  try {
    const data = Buffer.from(encoded, "base64url").toString()
    const [token, expiryStr] = data.split(":")
    const expiry = parseInt(expiryStr, 10)
    if (!token || isNaN(expiry)) return null
    return { token, expiry }
  } catch {
    return null
  }
}

export function verifyPassword(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) return false
  return bcrypt.compareSync(password, hash)
}

export async function createSession(): Promise<void> {
  const token = uuid()
  const expiry = Date.now() + SESSION_EXPIRY
  const encoded = encode(token, expiry)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_EXPIRY / 1000,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const encoded = cookieStore.get(SESSION_COOKIE)?.value
  if (!encoded) return false
  const data = decode(encoded)
  if (!data || Date.now() > data.expiry) {
    cookieStore.delete(SESSION_COOKIE)
    return false
  }
  return true
}
