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

export async function getActivityData(userIdParam?: string): Promise<ActivityData[]> {
  const db = await getDb()
  let userId: ObjectId

  if (userIdParam) {
    userId = new ObjectId(userIdParam)
  } else {
    const user = await getCurrentUser()
    if (!user) return []
    userId = new ObjectId(user._id)
  }

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

  // Fill all days in the past year and mark as active/inactive
  const today = new Date()
  const oneYearAgo = subDays(today, 365)
  const result: ActivityData[] = []
  
  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = format(d, "yyyy-MM-dd")
    const count = activityMap.get(dateStr) || 0
    
    // Calculate level based on count
    // Level 0 = no activity (red), Level 1+ = has activity (green shades)
    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (count > 0) {
      // Any activity marks the day as active
      if (count === 1) level = 1 // 1 activity
      else if (count <= 3) level = 2 // 2-3 activities
      else if (count <= 5) level = 3 // 4-5 activities
      else level = 4 // 6+ activities
    }
    
    result.push({ date: dateStr, count, level })
  }

  return result
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

export interface ProgressDataPoint {
  date: string
  prayers: number
  todos: number
  total: number
  points: number
}

export async function getProgressData(startDate: string, endDate: string, userIdParam?: string): Promise<ProgressDataPoint[]> {
  const db = await getDb()
  let userId: ObjectId

  if (userIdParam) {
    userId = new ObjectId(userIdParam)
  } else {
    const user = await getCurrentUser()
    if (!user) return []
    userId = new ObjectId(user._id)
  }

  // Get prayers in date range
  const prayers = await db
    .collection<Prayer>(collections.prayers)
    .find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
    .sort({ date: 1 })
    .toArray()

  // Get completed todos in date range
  const todos = await db
    .collection<Todo>(collections.todos)
    .find({
      userId,
      completed: true,
      completedAt: {
        $exists: true,
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59"),
      },
    })
    .toArray()

  // Create a map to aggregate data by date
  const progressMap = new Map<string, { prayers: number; todos: number; points: number }>()

  // Add prayers
  prayers.forEach((prayer) => {
    const date = prayer.date
    const existing = progressMap.get(date) || { prayers: 0, todos: 0, points: 0 }
    existing.prayers += prayer.completedCount
    existing.points += prayer.points
    progressMap.set(date, existing)
  })

  // Add todos
  todos.forEach((todo) => {
    if (todo.completedAt) {
      const date = format(new Date(todo.completedAt), "yyyy-MM-dd")
      const existing = progressMap.get(date) || { prayers: 0, todos: 0, points: 0 }
      existing.todos += 1
      existing.points += todo.points
      progressMap.set(date, existing)
    }
  })

  // Convert to array and fill missing dates
  const result: ProgressDataPoint[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = format(d, "yyyy-MM-dd")
    const data = progressMap.get(dateStr) || { prayers: 0, todos: 0, points: 0 }
    result.push({
      date: dateStr,
      prayers: data.prayers,
      todos: data.todos,
      total: data.prayers + data.todos,
      points: data.points,
    })
  }

  return result
}
