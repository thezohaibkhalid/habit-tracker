// Prayer time calculations and management
export const PRAYER_NAMES = {
  fajr: "Fajr",
  zuhr: "Zuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
} as const

export type PrayerName = keyof typeof PRAYER_NAMES

export const PRAYER_ORDER: PrayerName[] = ["fajr", "zuhr", "asr", "maghrib", "isha"]

// Default prayer times (these would typically come from an API based on location)
export function getDefaultPrayerTimes(): Record<PrayerName, string> {
  return {
    fajr: "05:30",
    zuhr: "13:00",
    asr: "16:30",
    maghrib: "18:45",
    isha: "20:15",
  }
}

export function getCurrentPrayer(prayerTimes: Record<PrayerName, string>): PrayerName | null {
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  for (let i = PRAYER_ORDER.length - 1; i >= 0; i--) {
    const prayer = PRAYER_ORDER[i]
    if (currentTime >= prayerTimes[prayer]) {
      return prayer
    }
  }

  return PRAYER_ORDER[PRAYER_ORDER.length - 1] // Default to Isha
}

export function getNextPrayer(prayerTimes: Record<PrayerName, string>): PrayerName {
  const current = getCurrentPrayer(prayerTimes)
  if (!current) return "fajr"

  const currentIndex = PRAYER_ORDER.indexOf(current)
  return PRAYER_ORDER[(currentIndex + 1) % PRAYER_ORDER.length]
}
