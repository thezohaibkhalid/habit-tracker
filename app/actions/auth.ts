"use server"

import { redirect } from "next/navigation"
import { hashPassword, verifyPassword, createSession, deleteSession } from "@/lib/auth"
import { getUserByEmail, createUser, createPasswordResetOTP, verifyPasswordResetOTP, updateUserPassword, createEmailVerificationOTP, verifyEmailVerificationOTP, checkUsernameAvailability } from "@/lib/db-utils"
import { sendOTPEmail, sendVerificationEmail } from "@/lib/email"

export async function signUp(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string

  if (!name || !email || !password || !username) {
    return { error: "All fields are required" }
  }

  // Validate username
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!usernameRegex.test(username)) {
    return { error: "Username must be 3-20 characters and contain only letters, numbers, and underscores" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return { error: "Email already exists" }
  }

  // Check username availability
  const isUsernameAvailable = await checkUsernameAvailability(username)
  if (!isUsernameAvailable) {
    return { error: "Username is already taken" }
  }

  const hashedPassword = await hashPassword(password)
  const userId = await createUser({
    email,
    password: hashedPassword,
    name,
    username: username.toLowerCase(),
    createdAt: new Date(),
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    emailVerified: false,
    privacySettings: {
      showPoints: true,
      showStreak: true,
      showProgress: true,
      showProfile: true,
    },
  })

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // Save OTP to database
  await createEmailVerificationOTP(email, otp)

  // Send verification email
  const emailResult = await sendVerificationEmail(email, otp, name)
  if (!emailResult.success) {
    return { error: "Failed to send verification email. Please try again later." }
  }

  // Redirect to verification page
  redirect(`/verify-email?email=${encodeURIComponent(email)}`)
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

  // Check if email is verified
  if (!user.emailVerified) {
    // Generate new OTP and send verification email
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    await createEmailVerificationOTP(email, otp)
    await sendVerificationEmail(email, otp, user.name)
    return { error: "Email not verified. Please check your email for the verification code.", needsVerification: true, email }
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

export async function verifyEmail(formData: FormData) {
  const email = formData.get("email") as string
  const otp = formData.get("otp") as string

  if (!email || !otp) {
    return { error: "Email and OTP are required" }
  }

  // Verify OTP
  const isValidOTP = await verifyEmailVerificationOTP(email, otp)
  if (!isValidOTP) {
    return { error: "Invalid or expired verification code" }
  }

  // Create session and redirect to dashboard
  await createSession(email)
  redirect("/dashboard")
}

export async function resendVerificationEmail(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { error: "Email is required" }
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return { error: "User not found" }
  }

  if (user.emailVerified) {
    return { error: "Email is already verified" }
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await createEmailVerificationOTP(email, otp)

  // Send email
  const emailResult = await sendVerificationEmail(email, otp, user.name)
  if (!emailResult.success) {
    return { error: "Failed to send email. Please try again later." }
  }

  return { success: true, message: "Verification code has been sent to your email." }
}
