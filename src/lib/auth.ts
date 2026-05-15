import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { v4 as uuid } from "uuid"

const SESSION_COOKIE = "admin_session"
const SESSION_EXPIRY = 1000 * 60 * 60 * 24 // 24 hours

const sessions = new Map<string, number>()

export function verifyPassword(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) return false
  return bcrypt.compareSync(password, hash)
}

export async function createSession(): Promise<string> {
  const token = uuid()
  sessions.set(token, Date.now() + SESSION_EXPIRY)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_EXPIRY / 1000,
  })
  return token
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) sessions.delete(token)
  cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return false
  const expiry = sessions.get(token)
  if (!expiry || Date.now() > expiry) {
    sessions.delete(token)
    return false
  }
  return true
}
