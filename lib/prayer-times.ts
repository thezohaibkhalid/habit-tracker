import { getPakistanTime } from "./time-utils"
import { convertTo12Hour } from "./time-utils"

export const PRAYER_NAMES = {
  fajr: "Fajr",
  zuhr: "Zuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
} as const

export type PrayerName = keyof typeof PRAYER_NAMES

export const PRAYER_ORDER: PrayerName[] = ["fajr", "zuhr", "asr", "maghrib", "isha"]

const PRAYER_TIMES_24H: Record<PrayerName, string> = {
  fajr: "05:30",
  zuhr: "13:00",
  asr: "16:30",
  maghrib: "18:45",
  isha: "20:15",
}

export function getDefaultPrayerTimes(): Record<PrayerName, string> {
  return {
    fajr: convertTo12Hour(PRAYER_TIMES_24H.fajr),
    zuhr: convertTo12Hour(PRAYER_TIMES_24H.zuhr),
    asr: convertTo12Hour(PRAYER_TIMES_24H.asr),
    maghrib: convertTo12Hour(PRAYER_TIMES_24H.maghrib),
    isha: convertTo12Hour(PRAYER_TIMES_24H.isha),
  }
}

function convert12HourTo24Hour(time12h: string): string {
  const [time, period] = time12h.split(" ")
  const [hours, minutes] = time.split(":")
  let hour24 = parseInt(hours, 10)
  
  if (period === "PM" && hour24 !== 12) {
    hour24 += 12
  } else if (period === "AM" && hour24 === 12) {
    hour24 = 0
  }
  
  return `${String(hour24).padStart(2, "0")}:${minutes}`
}

export function getCurrentPrayer(prayerTimes: Record<PrayerName, string>): PrayerName | null {
  const now = getPakistanTime()
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  for (let i = PRAYER_ORDER.length - 1; i >= 0; i--) {
    const prayer = PRAYER_ORDER[i]
    const prayerTime24h = convert12HourTo24Hour(prayerTimes[prayer])
    if (currentTime >= prayerTime24h) {
      return prayer
    }
  }

  return PRAYER_ORDER[PRAYER_ORDER.length - 1]
}

export function getNextPrayer(prayerTimes: Record<PrayerName, string>): PrayerName {
  const current = getCurrentPrayer(prayerTimes)
  if (!current) return "fajr"

  const currentIndex = PRAYER_ORDER.indexOf(current)
  return PRAYER_ORDER[(currentIndex + 1) % PRAYER_ORDER.length]
}
