"use server"

import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { collections } from "@/lib/db-utils"
import { ObjectId } from "mongodb"
import type { Prayer, Todo } from "@/lib/models"
import { subDays, startOfWeek, endOfWeek } from "date-fns"
import { getPakistanTime, getPakistanDateString, formatPakistanDate } from "@/lib/time-utils"

export interface ActivityData {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4 | 5
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

  const oneYearAgoDate = subDays(getPakistanTime(), 365)
  const oneYearAgoStr = getPakistanDateString(oneYearAgoDate)
  
  const allPrayers = await db
    .collection<Prayer>(collections.prayers)
    .find({ userId })
    .toArray()
    
  const prayers = allPrayers.filter((prayer) => {
    if (!prayer.date) return false
    return prayer.date >= oneYearAgoStr
  })
  
  const todos = await db
    .collection<Todo>(collections.todos)
    .find({
      userId,
      completed: true,
      completedAt: { $exists: true, $gte: oneYearAgoDate },
    })
    .toArray()

  const activityMap = new Map<string, number>()

  prayers.forEach((prayer) => {
    if (!prayer.date) return
    
    const prayerDate = String(prayer.date).trim()
    
    let count = 0
    
    if (prayer.completedCount && prayer.completedCount > 0) {
      count = prayer.completedCount
    } else if (prayer.prayers) {
      count = Object.values(prayer.prayers).filter(Boolean).length
    } else if (prayer.points && prayer.points > 0) {
      count = Math.floor(prayer.points / 10)
    }
    
    if (count > 0) {
      const currentCount = activityMap.get(prayerDate) || 0
      activityMap.set(prayerDate, currentCount + count)
    }
  })

  console.log("Activity Map Sample:", Array.from(activityMap.entries()).slice(0, 5))
  console.log("Total prayers found:", prayers.length)
  console.log("Prayer dates sample:", prayers.slice(0, 3).map(p => ({ date: p.date, count: p.completedCount, points: p.points })))

  todos.forEach((todo) => {
    if (todo.completedAt) {
      const todoDate = new Date(todo.completedAt)
      const dateStr = getPakistanDateString(todoDate)
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1)
    }
  })

  const today = getPakistanTime()
  const result: ActivityData[] = []
  
  const startDateStr = oneYearAgoStr
  const endDateStr = getPakistanDateString(today)
  
  const [startYear, startMonth, startDay] = startDateStr.split("-").map(Number)
  const [endYear, endMonth, endDay] = endDateStr.split("-").map(Number)
  
  let currentYear = startYear
  let currentMonth = startMonth
  let currentDay = startDay
  
  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth < endMonth) ||
    (currentYear === endYear && currentMonth === endMonth && currentDay <= endDay)
  ) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`
    const count = activityMap.get(dateStr) || 0
    
    if (dateStr === "2025-12-21" || dateStr === "2024-12-20" || dateStr === "2025-12-20") {
      console.log(`Checking date ${dateStr}: count=${count}, inMap=${activityMap.has(dateStr)}, mapKeys=${Array.from(activityMap.keys()).filter(k => k.includes("2025-12-21") || k.includes("2024-12-20") || k.includes("2025-12-20"))}`)
    }
    
    let level: 0 | 1 | 2 | 3 | 4 | 5 = 0
    if (count > 0) {
      if (count === 1) level = 1
      else if (count === 2) level = 2
      else if (count === 3) level = 3
      else if (count === 4) level = 4
      else if (count >= 5) level = 5
    }
    
    result.push({ date: dateStr, count, level })
    
    currentDay++
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    if (currentDay > daysInMonth) {
      currentDay = 1
      currentMonth++
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }
    }
  }

  return result
}

export async function getAnalytics() {
  const user = await getCurrentUser()
  if (!user) return null

  const db = await getDb()
  const userId = new ObjectId(user._id)

  const thirtyDaysAgo = getPakistanDateString(subDays(getPakistanTime(), 30))
  const prayers = await db
    .collection<Prayer>(collections.prayers)
    .find({
      userId,
      date: { $gte: thirtyDaysAgo },
    })
    .sort({ date: 1 })
    .toArray()

  const prayersByDay = prayers.map((p) => ({
    date: p.date,
    count: p.completedCount,
  }))

  const totalPrayers = prayers.reduce((sum, p) => sum + p.completedCount, 0)
  const possiblePrayers = prayers.length * 5
  const prayerCompletionRate = possiblePrayers > 0 ? Math.round((totalPrayers / possiblePrayers) * 100) : 0

  const allTodos = await db.collection<Todo>(collections.todos).find({ userId }).toArray()

  const completedTodos = allTodos.filter((t) => t.completed).length
  const totalTodos = allTodos.length
  const todoCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  const today = getPakistanTime()
  const thisWeekStart = getPakistanDateString(startOfWeek(today))
  const thisWeekEnd = getPakistanDateString(endOfWeek(today))
  const lastWeekStart = getPakistanDateString(startOfWeek(subDays(today, 7)))
  const lastWeekEnd = getPakistanDateString(endOfWeek(subDays(today, 7)))

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

  const prayers = await db
    .collection<Prayer>(collections.prayers)
    .find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
    .sort({ date: 1 })
    .toArray()

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

  const progressMap = new Map<string, { prayers: number; todos: number; points: number }>()

  prayers.forEach((prayer) => {
    const date = prayer.date
    const existing = progressMap.get(date) || { prayers: 0, todos: 0, points: 0 }
    existing.prayers += prayer.completedCount
    existing.points += prayer.points
    progressMap.set(date, existing)
  })

  todos.forEach((todo) => {
    if (todo.completedAt) {
      const date = formatPakistanDate(new Date(todo.completedAt), "yyyy-MM-dd")
      const existing = progressMap.get(date) || { prayers: 0, todos: 0, points: 0 }
      existing.todos += 1
      existing.points += todo.points
      progressMap.set(date, existing)
    }
  })

  const result: ProgressDataPoint[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatPakistanDate(d, "yyyy-MM-dd")
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
