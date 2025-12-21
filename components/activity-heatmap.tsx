"use client"

import { useMemo } from "react"
import { format, subDays, startOfWeek, addDays } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActivityData {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

interface ActivityHeatmapProps {
  data: ActivityData[]
  weeks?: number
}

export function ActivityHeatmap({ data, weeks = 52 }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date()
    const startDate = subDays(today, weeks * 7)
    const start = startOfWeek(startDate, { weekStartsOn: 0 })

    const days: ActivityData[] = []
    for (let i = 0; i < weeks * 7; i++) {
      const currentDay = addDays(start, i)
      const dateStr = format(currentDay, "yyyy-MM-dd")
      const dayData = data.find((d) => d.date === dateStr)
      days.push({
        date: dateStr,
        count: dayData?.count || 0,
        level: dayData?.level || 0,
      })
    }

    const grouped: ActivityData[][] = []
    for (let i = 0; i < weeks; i++) {
      grouped.push(days.slice(i * 7, (i + 1) * 7))
    }

    return grouped
  }, [data, weeks])

  const getColor = (level: number, date: string) => {
    const dateObj = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dateObj.setHours(0, 0, 0, 0)
    const isToday = dateObj.getTime() === today.getTime()
    const isFuture = dateObj > today
    
    // Future dates - gray
    if (isFuture) {
      return "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
    }
    
    switch (level) {
      case 0:
        // No activity - red (only for past dates, not today)
        return isToday 
          ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          : "bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800"
      case 1:
        return "bg-emerald-200 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-800"
      case 2:
        return "bg-emerald-400 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600"
      case 3:
        return "bg-emerald-600 dark:bg-emerald-500 border-emerald-700 dark:border-emerald-400"
      case 4:
        return "bg-emerald-800 dark:bg-emerald-300 border-emerald-900 dark:border-emerald-200"
      default:
        return isToday
          ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          : "bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800"
    }
  }

  return (
    <TooltipProvider>
      <div className="w-full flex flex-col items-center">
        <div className="w-full overflow-x-auto flex justify-center">
          <div className="inline-flex gap-1">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <Tooltip key={`${weekIndex}-${dayIndex}`}>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-3 w-3 rounded-sm border ${getColor(day.level, day.date)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {format(new Date(day.date), "MMM d, yyyy")}
                        <br />
                        {day.count > 0 ? (
                          <>
                            {day.count} {day.count === 1 ? "activity" : "activities"}
                          </>
                        ) : (
                          "No activity"
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => {
              // Use a past date for legend to show proper colors
              const pastDate = format(subDays(new Date(), 10), "yyyy-MM-dd")
              return (
                <div key={level} className={`h-3 w-3 rounded-sm border ${getColor(level, pastDate)}`} />
              )
            })}
          </div>
          <span>More</span>
          <span className="ml-4 text-red-600 dark:text-red-400">●</span>
          <span className="text-xs">No activity</span>
        </div>
      </div>
    </TooltipProvider>
  )
}
