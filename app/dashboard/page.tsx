import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPrayersForDate } from "@/app/actions/prayers"
import { getTodos } from "@/app/actions/todos"
import { getAnalytics, getActivityData } from "@/app/actions/analytics"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { PrayerTracker } from "@/components/prayer-tracker"
import { TodoList } from "@/components/todo-list"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, Trophy, Flame, TrendingUp } from "lucide-react"
import { format } from "date-fns"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Convert MongoDB document to plain object for Client Components
  const userForClient = {
    name: user.name,
    email: user.email,
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const [todayPrayers, todos, analytics, activityData] = await Promise.all([
    getPrayersForDate(today),
    getTodos(),
    getAnalytics(),
    getActivityData(),
  ])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardHeader user={userForClient} />

      <main className="container py-8">
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Points" value={user.totalPoints} icon={Trophy} description="All-time score" />
            <StatCard
              title="Current Streak"
              value={`${user.currentStreak} days`}
              icon={Flame}
              trend={{ value: 12, positive: true }}
            />
            <StatCard
              title="Longest Streak"
              value={`${user.longestStreak} days`}
              icon={TrendingUp}
              description="Personal record"
            />
            <StatCard
              title="Completion Rate"
              value={`${analytics?.prayerCompletionRate || 0}%`}
              icon={Target}
              trend={{ value: analytics?.weeklyTrend || 0, positive: (analytics?.weeklyTrend || 0) >= 0 }}
            />
          </div>

          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Your Activity</CardTitle>
              <CardDescription>Track your daily progress over the past year</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap data={activityData} weeks={52} />
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="prayers">Prayers</TabsTrigger>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <PrayerTracker initialPrayers={todayPrayers?.prayers} />
                <TodoList initialTodos={todos} />
              </div>
            </TabsContent>

            <TabsContent value="prayers">
              <div className="max-w-2xl mx-auto">
                <PrayerTracker initialPrayers={todayPrayers?.prayers} />
              </div>
            </TabsContent>

            <TabsContent value="todos">
              <div className="max-w-3xl mx-auto">
                <TodoList initialTodos={todos} />
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              {analytics ? (
                <AnalyticsDashboard data={analytics} />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <p>No analytics data available yet. Start tracking to see your progress!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
