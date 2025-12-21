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

  // Toggle the specific prayer
  prayers[prayerName as keyof typeof prayers] = !prayers[prayerName as keyof typeof prayers]

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

  // Update user total points
  await db.collection(collections.users).updateOne({ _id: userId }, { $inc: { totalPoints: existing ? 0 : points } })

  revalidatePath("/dashboard")
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
