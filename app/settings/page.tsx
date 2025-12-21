"use client"

import { useState, useEffect } from "react"
import { updatePrivacySettings, getPrivacySettings } from "@/app/actions/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Shield, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import Link from "next/link"
import { toast } from "sonner"

export default function SettingsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    showPoints: true,
    showStreak: true,
    showProgress: true,
    showProfile: true,
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current user
        const userResponse = await fetch("/api/user/current")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setCurrentUser({ name: userData.name, email: userData.email })
        }

        // Fetch privacy settings
        const settingsData = await getPrivacySettings()
        if (settingsData) {
          setSettings(settingsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePrivacySettings(settings)
      toast.success("Settings saved", {
        description: "Your privacy settings have been updated successfully.",
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save settings. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {currentUser && <DashboardHeader user={currentUser} />}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Privacy Settings</CardTitle>
            </div>
            <CardDescription>Control what information is visible to other users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="showProfile" className="text-base font-medium">
                    Show Profile in Search
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to find and view your profile
                  </p>
                </div>
                <Switch
                  id="showProfile"
                  checked={settings.showProfile}
                  onCheckedChange={(checked) => setSettings({ ...settings, showProfile: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="showPoints" className="text-base font-medium">
                    Show Points
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your total points on your profile
                  </p>
                </div>
                <Switch
                  id="showPoints"
                  checked={settings.showPoints}
                  onCheckedChange={(checked) => setSettings({ ...settings, showPoints: checked })}
                  disabled={!settings.showProfile}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="showStreak" className="text-base font-medium">
                    Show Streak
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your current and longest streak on your profile
                  </p>
                </div>
                <Switch
                  id="showStreak"
                  checked={settings.showStreak}
                  onCheckedChange={(checked) => setSettings({ ...settings, showStreak: checked })}
                  disabled={!settings.showProfile}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="showProgress" className="text-base font-medium">
                    Show Progress Charts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your activity and progress graphs on your profile
                  </p>
                </div>
                <Switch
                  id="showProgress"
                  checked={settings.showProgress}
                  onCheckedChange={(checked) => setSettings({ ...settings, showProgress: checked })}
                  disabled={!settings.showProfile}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

