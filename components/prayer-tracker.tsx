"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Circle } from "lucide-react"
import { togglePrayer } from "@/app/actions/prayers"
import { PRAYER_NAMES, PRAYER_ORDER, getDefaultPrayerTimes, type PrayerName } from "@/lib/prayer-times"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

interface PrayerTrackerProps {
  initialPrayers?: {
    fajr: boolean
    zuhr: boolean
    asr: boolean
    maghrib: boolean
    isha: boolean
  }
}

export function PrayerTracker({ initialPrayers }: PrayerTrackerProps) {
  const router = useRouter()
  const [prayers, setPrayers] = useState(
    initialPrayers || {
      fajr: false,
      zuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    },
  )
  const [loading, setLoading] = useState<string | null>(null)
  const prayerTimes = getDefaultPrayerTimes()
  const today = format(new Date(), "yyyy-MM-dd")

  const completedCount = Object.values(prayers).filter(Boolean).length
  const totalPrayers = PRAYER_ORDER.length

  const handleToggle = async (prayerName: PrayerName) => {
    setLoading(prayerName)
    try {
      await togglePrayer(today, prayerName)
      setPrayers((prev) => ({
        ...prev,
        [prayerName]: !prev[prayerName],
      }))
      router.refresh()
    } catch (error) {
      console.error("Failed to toggle prayer:", error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Today's Prayers</CardTitle>
            <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
          </div>
          <Badge variant={completedCount === totalPrayers ? "default" : "secondary"} className="text-lg px-3 py-1">
            {completedCount}/{totalPrayers}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {PRAYER_ORDER.map((prayerName) => (
          <Button
            key={prayerName}
            variant={prayers[prayerName] ? "default" : "outline"}
            className="w-full justify-between h-auto py-4"
            onClick={() => handleToggle(prayerName)}
            disabled={loading === prayerName}
          >
            <div className="flex items-center gap-3">
              {prayers[prayerName] ? (
                <Check className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="text-left">
                <div className="font-semibold">{PRAYER_NAMES[prayerName]}</div>
                <div className="text-sm opacity-80">{prayerTimes[prayerName]}</div>
              </div>
            </div>
            <Badge variant={prayers[prayerName] ? "secondary" : "outline"}>+10 pts</Badge>
          </Button>
        ))}

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Today's Points</span>
            <span className="text-2xl font-bold text-primary">{completedCount * 10}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
