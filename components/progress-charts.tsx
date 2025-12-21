"use client"

import { useState, useEffect } from "react"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { getPakistanTime, formatPakistanDate, getPakistanDateString } from "@/lib/time-utils"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProgressDataPoint } from "@/app/actions/analytics"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

interface ProgressChartsProps {
  initialData: ProgressDataPoint[]
}

type FilterType = "week" | "month" | "custom"

export function ProgressCharts({ initialData }: ProgressChartsProps) {
  const [data, setData] = useState<ProgressDataPoint[]>(initialData)
  const [filterType, setFilterType] = useState<FilterType>("week")
  const [startDate, setStartDate] = useState<Date>(startOfWeek(getPakistanTime()))
  const [endDate, setEndDate] = useState<Date>(endOfWeek(getPakistanTime()))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const start = getPakistanDateString(startDate)
        const end = getPakistanDateString(endDate)
        const response = await fetch(`/api/progress?start=${start}&end=${end}`)
        const newData = await response.json()
        setData(newData)
      } catch (error) {
        console.error("Failed to fetch progress data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate])

  const handleFilterChange = (value: FilterType) => {
    setFilterType(value)
    const today = getPakistanTime()

    switch (value) {
      case "week":
        setStartDate(startOfWeek(today))
        setEndDate(endOfWeek(today))
        break
      case "month":
        setStartDate(startOfMonth(today))
        setEndDate(endOfMonth(today))
        break
      case "custom":
        break
    }
  }

  const chartData = {
    labels: data.map((d) => formatPakistanDate(new Date(d.date), "MMM d")),
    datasets: [
      {
        label: "Prayers",
        data: data.map((d) => d.prayers),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Todos",
        data: data.map((d) => d.todos),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const barData = {
    labels: data.map((d) => formatPakistanDate(new Date(d.date), "MMM d")),
    datasets: [
      {
        label: "Total Activities",
        data: data.map((d) => d.total),
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        borderColor: "rgb(139, 92, 246)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const pointsData = {
    labels: data.map((d) => formatPakistanDate(new Date(d.date), "MMM d")),
    datasets: [
      {
        label: "Points Earned",
        data: data.map((d) => d.points),
        borderColor: "rgb(251, 146, 60)",
        backgroundColor: "rgba(251, 146, 60, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          precision: 0,
          font: {
            size: 11,
          },
        },
      },
    },
  }

  const totalActivities = data.reduce((sum, d) => sum + d.total, 0)
  const totalPoints = data.reduce((sum, d) => sum + d.points, 0)
  const avgDaily = data.length > 0 ? (totalActivities / data.length).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Progress Charts</CardTitle>
              <CardDescription>Track your daily activities and points over time</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterType} onValueChange={(value) => handleFilterChange(value as FilterType)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {filterType === "custom" && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatPakistanDate(startDate, "MMM d")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatPakistanDate(endDate, "MMM d")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={(date) => date && setEndDate(date)} />
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold">{totalActivities}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-2xl font-bold">{totalPoints}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-sm text-muted-foreground">Avg Daily</p>
              <p className="text-2xl font-bold">{avgDaily}</p>
            </div>
          </div>

          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <>
              {/* Activities Line Chart */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Activities Over Time</h3>
                <div className="h-[300px]">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* Total Activities Bar Chart */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Daily Total Activities</h3>
                <div className="h-[300px]">
                  <Bar data={barData} options={chartOptions} />
                </div>
              </div>

              {/* Points Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Points Earned</h3>
                <div className="h-[300px]">
                  <Line data={pointsData} options={chartOptions} />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

