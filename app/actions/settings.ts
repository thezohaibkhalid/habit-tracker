"use server"

import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { collections } from "@/lib/db-utils"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"

export async function updatePrivacySettings(settings: {
  showPoints: boolean
  showStreak: boolean
  showProgress: boolean
  showProfile: boolean
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const db = await getDb()
  await db.collection(collections.users).updateOne(
    { _id: new ObjectId(user._id) },
    { $set: { privacySettings: settings } },
  )

  revalidatePath("/dashboard")
  revalidatePath("/users")
  return { success: true }
}

export async function getPrivacySettings() {
  const user = await getCurrentUser()
  if (!user) return null

  return user.privacySettings || {
    showPoints: true,
    showStreak: true,
    showProgress: true,
    showProfile: true,
  }
}

