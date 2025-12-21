"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

interface AnalyticsData {
  prayersByDay: Array<{ date: string; count: number }>
  prayerCompletionRate: number
  todoCompletionRate: number
  totalPrayers: number
  totalTodos: number
  completedTodos: number
  weeklyTrend: number
  pointsBreakdown: {
    prayers: number
    todos: number
    total: number
  }
}

interface AnalyticsDashboardProps {
  data: AnalyticsData
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const pieData = [
    { name: "Prayers", value: data.pointsBreakdown.prayers, color: "hsl(142, 76%, 36%)" },
    { name: "Todos", value: data.pointsBreakdown.todos, color: "hsl(217, 91%, 60%)" },
  ]

  return (
    <div className="space-y-6">
      {/* Completion Rates */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prayer Completion</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{data.prayerCompletionRate}%</span>
              <div className="flex items-center gap-1 text-sm">
                {data.weeklyTrend >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600">+{data.weeklyTrend}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">{data.weeklyTrend}%</span>
                  </>
                )}
              </div>
            </div>
            <Progress value={data.prayerCompletionRate} className="h-2" />
            <p className="text-sm text-muted-foreground">{data.totalPrayers} prayers completed in the last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Completion</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{data.todoCompletionRate}%</span>
            </div>
            <Progress value={data.todoCompletionRate} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {data.completedTodos} of {data.totalTodos} tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Prayer Activity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.prayersByDay}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value} prayers`, "Completed"]}
                />
                <Bar dataKey="count" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Points Distribution</CardTitle>
            <CardDescription>Total: {data.pointsBreakdown.total} points</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-600" />
                  <span>Prayers</span>
                </div>
                <span className="font-semibold">{data.pointsBreakdown.prayers} pts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-600" />
                  <span>Todos</span>
                </div>
                <span className="font-semibold">{data.pointsBreakdown.todos} pts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>Based on your recent activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.prayerCompletionRate < 80 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Your prayer completion rate is below 80%. Try setting reminders to improve consistency.
              </p>
            </div>
          )}
          {data.todoCompletionRate > 90 && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                Excellent! You're completing over 90% of your tasks. Keep up the great work!
              </p>
            </div>
          )}
          {data.weeklyTrend > 20 && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                You're on fire! Your activity increased by {data.weeklyTrend}% this week.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
