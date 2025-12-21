"use server"

import { redirect } from "next/navigation"
import { hashPassword, verifyPassword, createSession, deleteSession } from "@/lib/auth"
import { getUserByEmail, createUser, createPasswordResetOTP, verifyPasswordResetOTP, updateUserPassword } from "@/lib/db-utils"
import { sendOTPEmail } from "@/lib/email"

export async function signUp(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!name || !email || !password) {
    return { error: "All fields are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return { error: "Email already exists" }
  }

  const hashedPassword = await hashPassword(password)
  const userId = await createUser({
    email,
    password: hashedPassword,
    name,
    createdAt: new Date(),
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
  })

  await createSession(email)
  redirect("/dashboard")
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return { error: "Invalid email or password" }
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return { error: "Invalid email or password" }
  }

  await createSession(email)
  redirect("/dashboard")
}

export async function signOut() {
  await deleteSession()
  redirect("/")
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { error: "Email is required" }
  }

  const user = await getUserByEmail(email)
  if (!user) {
    // Don't reveal if email exists or not for security
    return { success: true, message: "If an account exists with this email, a verification code has been sent." }
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // Save OTP to database
  await createPasswordResetOTP(email, otp)

  // Send email
  const emailResult = await sendOTPEmail(email, otp, user.name)
  if (!emailResult.success) {
    return { error: "Failed to send email. Please try again later." }
  }

  return { success: true, message: "Verification code has been sent to your email." }
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string
  const otp = formData.get("otp") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!email || !otp || !password || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  // Verify OTP
  const isValidOTP = await verifyPasswordResetOTP(email, otp)
  if (!isValidOTP) {
    return { error: "Invalid or expired verification code" }
  }

  // Update password
  await updateUserPassword(email, password)

  return { success: true, message: "Password has been reset successfully." }
}
