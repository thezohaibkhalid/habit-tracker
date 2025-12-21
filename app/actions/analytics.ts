"use server"

import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { collections } from "@/lib/db-utils"
import { ObjectId } from "mongodb"
import type { Prayer, Todo } from "@/lib/models"
import { subDays, format, startOfWeek, endOfWeek } from "date-fns"

export interface ActivityData {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export async function getActivityData(): Promise<ActivityData[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const db = await getDb()
  const userId = new ObjectId(user._id)

  // Get prayers for the past year (365 days)
  const oneYearAgo = format(subDays(new Date(), 365), "yyyy-MM-dd")
  const prayers = await db
    .collection<Prayer>(collections.prayers)
    .find({
      userId,
      date: { $gte: oneYearAgo },
    })
    .toArray()

  // Get completed todos from the past year
  const oneYearAgoDate = subDays(new Date(), 365)
  const todos = await db
    .collection<Todo>(collections.todos)
    .find({
      userId,
      completed: true,
      completedAt: { $exists: true, $gte: oneYearAgoDate },
    })
    .toArray()

  // Combine activities by date
  const activityMap = new Map<string, number>()

  // Add prayers (each completed prayer counts as 1 activity)
  prayers.forEach((prayer) => {
    if (prayer.completedCount > 0) {
      activityMap.set(prayer.date, (activityMap.get(prayer.date) || 0) + prayer.completedCount)
    }
  })

  // Add completed todos (each completed todo counts as 1 activity)
  todos.forEach((todo) => {
    if (todo.completedAt) {
      const dateStr = format(new Date(todo.completedAt), "yyyy-MM-dd")
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1)
    }
  })

  // Convert to array and calculate levels
  const activityData: ActivityData[] = Array.from(activityMap.entries()).map(([date, count]) => {
    // Calculate level based on count (similar to GitHub's contribution levels)
    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (count > 0) {
      if (count <= 2) level = 1
      else if (count <= 4) level = 2
      else if (count <= 6) level = 3
      else level = 4
    }
    return { date, count, level }
  })

  return activityData
}

export async function getAnalytics() {
  const user = await getCurrentUser()
  if (!user) return null

  const db = await getDb()
  const userId = new ObjectId(user._id)

  // Get last 30 days of prayers
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd")
  const prayers = await db
    .collection<Prayer>(collections.prayers)
    .find({
      userId,
      date: { $gte: thirtyDaysAgo },
    })
    .sort({ date: 1 })
    .toArray()

  // Calculate prayer stats
  const prayersByDay = prayers.map((p) => ({
    date: p.date,
    count: p.completedCount,
  }))

  const totalPrayers = prayers.reduce((sum, p) => sum + p.completedCount, 0)
  const possiblePrayers = prayers.length * 5
  const prayerCompletionRate = possiblePrayers > 0 ? Math.round((totalPrayers / possiblePrayers) * 100) : 0

  // Get todos stats
  const allTodos = await db.collection<Todo>(collections.todos).find({ userId }).toArray()

  const completedTodos = allTodos.filter((t) => t.completed).length
  const totalTodos = allTodos.length
  const todoCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  // This week vs last week
  const today = new Date()
  const thisWeekStart = format(startOfWeek(today), "yyyy-MM-dd")
  const thisWeekEnd = format(endOfWeek(today), "yyyy-MM-dd")
  const lastWeekStart = format(startOfWeek(subDays(today, 7)), "yyyy-MM-dd")
  const lastWeekEnd = format(endOfWeek(subDays(today, 7)), "yyyy-MM-dd")

  const thisWeekPrayers = await db
    .collection<Prayer>(collections.prayers)
    .find({
      userId,
      date: { $gte: thisWeekStart, $lte: thisWeekEnd },
    })
    .toArray()

  const lastWeekPrayers = await db
    .collection<Prayer>(collections.prayers)
    .find({
      userId,
      date: { $gte: lastWeekStart, $lte: lastWeekEnd },
    })
    .toArray()

  const thisWeekCount = thisWeekPrayers.reduce((sum, p) => sum + p.completedCount, 0)
  const lastWeekCount = lastWeekPrayers.reduce((sum, p) => sum + p.completedCount, 0)
  const weeklyTrend = lastWeekCount > 0 ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100) : 0

  // Points breakdown
  const prayerPoints = prayers.reduce((sum, p) => sum + p.points, 0)
  const todoPoints = allTodos.filter((t) => t.completed).reduce((sum, t) => sum + t.points, 0)

  return {
    prayersByDay,
    prayerCompletionRate,
    todoCompletionRate,
    totalPrayers,
    totalTodos,
    completedTodos,
    weeklyTrend,
    pointsBreakdown: {
      prayers: prayerPoints,
      todos: todoPoints,
      total: prayerPoints + todoPoints,
    },
  }
}
