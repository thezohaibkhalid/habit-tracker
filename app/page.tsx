import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, TrendingUp, Trophy, Flame } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mx-auto">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-balance">
            Track Your Habits, <span className="text-primary">Build Your Future</span>
          </h1>
          <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
            A professional habit tracker designed to help you stay consistent with your daily prayers, tasks, and goals.
            Earn points, build streaks, and watch your progress grow.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              <h3 className="font-semibold text-lg">Prayer Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Track all five daily prayers with reminders and earn points for consistency.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <Trophy className="h-10 w-10 text-blue-600" />
              <h3 className="font-semibold text-lg">Points System</h3>
              <p className="text-sm text-muted-foreground">
                Earn points for completing prayers and tasks. Watch your score grow over time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <Flame className="h-10 w-10 text-orange-600" />
              <h3 className="font-semibold text-lg">Streak Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Build momentum with GitHub-style heatmaps and maintain your daily streaks.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <TrendingUp className="h-10 w-10 text-purple-600" />
              <h3 className="font-semibold text-lg">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Get insights into your habits with detailed charts and performance metrics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
