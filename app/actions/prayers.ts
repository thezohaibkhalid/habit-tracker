"use server"

import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { collections } from "@/lib/db-utils"
import { ObjectId } from "mongodb"
import type { Prayer } from "@/lib/models"
import { revalidatePath } from "next/cache"

export async function togglePrayer(date: string, prayerName: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const db = await getDb()
  const userId = new ObjectId(user._id)

  // Get existing prayer record for the day
  const existing = await db.collection<Prayer>(collections.prayers).findOne({
    userId,
    date,
  })

  const prayers = existing?.prayers || {
    fajr: false,
    zuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  }

  // Prevent unchecking completed prayers - only allow checking
  if (prayers[prayerName as keyof typeof prayers]) {
    return { error: "Cannot uncheck a completed prayer" }
  }

  // Only allow marking as completed
  prayers[prayerName as keyof typeof prayers] = true

  const completedCount = Object.values(prayers).filter(Boolean).length
  const points = completedCount * 10 // 10 points per prayer

  await db.collection<Prayer>(collections.prayers).updateOne(
    { userId, date },
    {
      $set: {
        prayers,
        completedCount,
        points,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  )

  // Update user total points (only add points for new prayer, not when updating existing)
  const pointsToAdd = existing ? 10 : points // 10 points per prayer
  await db.collection(collections.users).updateOne({ _id: userId }, { $inc: { totalPoints: pointsToAdd } })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getPrayersForDate(date: string) {
  const user = await getCurrentUser()
  if (!user) return null

  const db = await getDb()
  const prayer = await db.collection<Prayer>(collections.prayers).findOne({
    userId: new ObjectId(user._id),
    date,
  })

  return prayer
}
