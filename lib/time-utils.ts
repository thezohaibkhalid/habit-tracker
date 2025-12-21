import { format, formatInTimeZone } from "date-fns-tz"

const PAKISTAN_TIMEZONE = "Asia/Karachi"

export function getPakistanTime(): Date {
  const now = new Date()
  const pakistanTime = new Date(now.toLocaleString("en-US", { timeZone: PAKISTAN_TIMEZONE }))
  return pakistanTime
}

export function formatPakistanDate(date: Date, formatStr: string): string {
  return formatInTimeZone(date, PAKISTAN_TIMEZONE, formatStr)
}

export function formatPakistanTime(date: Date): string {
  return formatInTimeZone(date, PAKISTAN_TIMEZONE, "h:mm a")
}

export function formatPakistanDateTime(date: Date): string {
  return formatInTimeZone(date, PAKISTAN_TIMEZONE, "MMM d, yyyy h:mm a")
}

export function getPakistanDateString(date?: Date): string {
  const d = date || getPakistanTime()
  return formatInTimeZone(d, PAKISTAN_TIMEZONE, "yyyy-MM-dd")
}

export function convertTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":")
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

