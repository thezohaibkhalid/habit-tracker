"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, User, TrendingUp, Flame, Trophy, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"

interface UserResult {
  _id: string
  username: string
  name: string
  totalPoints?: number
  currentStreak?: number
  longestStreak?: number
}

export default function UsersPage() {
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null)
  const router = useRouter()

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
    if (query.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setLoading(true)
        try {
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
          const data = await response.json()
          setUsers(data)
        } catch (error) {
          console.error("Error searching users:", error)
        } finally {
          setLoading(false)
        }
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setUsers([])
    }
  }, [query])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {currentUser && <DashboardHeader user={currentUser} />}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="search" className="space-y-4">
          <TabsList>
            <TabsTrigger value="search">Search Users</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Users</CardTitle>
                <CardDescription>Find and view other users' progress and performance</CardDescription>
              </CardHeader>
              <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading && (
              <div className="text-center py-8 text-muted-foreground">Searching...</div>
            )}

            {!loading && query.length >= 2 && users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            )}

            {users.length > 0 && (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center">
                            <User className="h-6 w-6 text-white dark:text-slate-900" />
                          </div>
                          <div>
                            <h3 className="font-semibold">@{user.username}</h3>
                            <p className="text-sm text-muted-foreground">{user.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Trophy className="h-4 w-4" />
                              <span>{user.totalPoints !== undefined ? user.totalPoints : "—"}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Points</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Flame className="h-4 w-4" />
                              <span>{user.currentStreak !== undefined ? user.currentStreak : "—"}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Streak</p>
                          </div>
                          <Button
                            onClick={() => router.push(`/users/${user.username}`)}
                            variant="outline"
                            size="sm"
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {query.length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                Type at least 2 characters to search for users
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

