import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  createdAt: Date
  totalPoints: number
  currentStreak: number
  longestStreak: number
}

export interface Prayer {
  _id?: ObjectId
  userId: ObjectId
  date: string
  prayers: {
    fajr: boolean
    zuhr: boolean
    asr: boolean
    maghrib: boolean
    isha: boolean
  }
  completedCount: number
  points: number
  createdAt: Date
}

export interface Todo {
  _id?: ObjectId
  userId: ObjectId
  title: string
  description?: string
  completed: boolean
  points: number
  dueDate?: Date
  createdAt: Date
  completedAt?: Date
}

export interface Habit {
  _id?: ObjectId
  userId: ObjectId
  name: string
  description?: string
  frequency: "daily" | "weekly"
  points: number
  createdAt: Date
}

export interface HabitLog {
  _id?: ObjectId
  userId: ObjectId
  habitId: ObjectId
  date: string
  completed: boolean
  createdAt: Date
}

export interface PasswordResetOTP {
  _id?: ObjectId
  email: string
  otp: string
  expiresAt: Date
  createdAt: Date
  used: boolean
}
