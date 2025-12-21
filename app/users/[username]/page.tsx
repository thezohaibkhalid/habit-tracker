"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProgressCharts } from "@/components/progress-charts"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { Trophy, Flame, TrendingUp, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { formatPakistanDate } from "@/lib/time-utils"
import type { ProgressDataPoint, ActivityData } from "@/app/actions/analytics"

interface UserProfile {
  _id: string
  username: string
  name: string
  totalPoints?: number
  currentStreak?: number
  longestStreak?: number
  createdAt: Date
  progressData?: ProgressDataPoint[]
  activityData?: ActivityData[]
}

function UserProfileContent() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    // Fetch current user for header
    async function fetchCurrentUser() {
      try {
        const response = await fetch("/api/user/current")
        if (response.ok) {
          const data = await response.json()
          setCurrentUser({ name: data.name, email: data.email })
        }
      } catch (error) {
        console.error("Error fetching current user:", error)
      }
    }
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/users/${username}`)
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        } else if (response.status === 403) {
          // Profile is private
          setUser(null)
        } else {
          // User not found or other error
          setUser(null)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchUser()
    }
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {currentUser && <DashboardHeader user={currentUser} />}
        <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <div className="space-y-2">
                <p className="text-lg font-semibold">Profile Not Available</p>
                <p className="text-muted-foreground">
                  This profile is private or the user does not exist.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Determine if user is doing positive (has activity in last 7 days)
  const last7Days = user.progressData?.slice(-7) || []
  const hasRecentActivity = last7Days.some((d) => d.total > 0)
  const avgDaily = last7Days.length > 0 ? last7Days.reduce((sum, d) => sum + d.total, 0) / 7 : 0
  const isPositive = hasRecentActivity && avgDaily > 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {currentUser && <DashboardHeader user={currentUser} />}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="space-y-6">
          {/* User Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center">
                    <User className="h-10 w-10 text-white dark:text-slate-900" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">@{user.username}</h1>
                    <p className="text-muted-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Joined {formatPakistanDate(new Date(user.createdAt), "MMMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isPositive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}>
                  {isPositive ? "✓ Active" : "Inactive"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900">
                    <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-bold">
                      {user.totalPoints !== undefined ? user.totalPoints : "Hidden"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
                    <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold">
                      {user.currentStreak !== undefined ? `${user.currentStreak} days` : "Hidden"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Longest Streak</p>
                    <p className="text-2xl font-bold">
                      {user.longestStreak !== undefined ? `${user.longestStreak} days` : "Hidden"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Heatmap */}
          {user.activityData && user.activityData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Daily activity over the past year</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityHeatmap data={user.activityData} weeks={52} />
              </CardContent>
            </Card>
          ) : user.activityData === undefined ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Activity data is private</p>
              </CardContent>
            </Card>
          ) : null}

          {/* Progress Charts */}
          {user.progressData && user.progressData.length > 0 ? (
            <ProgressCharts initialData={user.progressData} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>
                  {user.progressData === undefined || user.progressData.length === 0
                    ? "Progress data is private or not available"
                    : "No progress data available yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <UserProfileContent />
    </Suspense>
  )
}

