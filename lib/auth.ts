import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { getUserByEmail } from "./db-utils"
import type { User } from "./models"

const SESSION_COOKIE_NAME = "session"
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(userId: string) {
  const cookieStore = await cookies()
  const sessionData = JSON.stringify({ userId, expiresAt: Date.now() + SESSION_DURATION })
  cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie.value)
    if (session.expiresAt < Date.now()) {
      await deleteSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null

  const user = await getUserByEmail(session.userId)
  return user
}
