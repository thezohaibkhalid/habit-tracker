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

  const getColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-slate-100 dark:bg-slate-800"
      case 1:
        return "bg-emerald-200 dark:bg-emerald-900"
      case 2:
        return "bg-emerald-400 dark:bg-emerald-700"
      case 3:
        return "bg-emerald-600 dark:bg-emerald-500"
      case 4:
        return "bg-emerald-800 dark:bg-emerald-300"
      default:
        return "bg-slate-100 dark:bg-slate-800"
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
                        className={`h-3 w-3 rounded-sm border border-slate-200 dark:border-slate-700 ${getColor(day.level)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {format(new Date(day.date), "MMM d, yyyy")}
                        <br />
                        {day.count} {day.count === 1 ? "activity" : "activities"}
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
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`h-3 w-3 rounded-sm ${getColor(level)}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  )
}
