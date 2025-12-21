import { NextRequest, NextResponse } from "next/server"
import { getUserByUsername } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"
import { getProgressData, getActivityData } from "@/app/actions/analytics"
import { format, subDays } from "date-fns"

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    const user = await getUserByUsername(username)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check privacy settings
    const privacySettings = user.privacySettings || {
      showPoints: true,
      showStreak: true,
      showProgress: true,
      showProfile: true,
    }

    // Check if current user is viewing their own profile
    const currentUser = await getCurrentUser()
    const isOwnProfile = currentUser && currentUser._id?.toString() === user._id!.toString()

    // If profile is hidden and user is not viewing their own profile, deny access
    if (privacySettings.showProfile === false && !isOwnProfile) {
      return NextResponse.json({ error: "This profile is private" }, { status: 403 })
    }

    // Get progress data
    // If it's own profile, always show data. Otherwise, respect privacy settings
    let progressData: any[] = []
    if (isOwnProfile || privacySettings.showProgress !== false) {
      const endDate = format(new Date(), "yyyy-MM-dd")
      const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd")
      progressData = await getProgressData(startDate, endDate, user._id!.toString())
    }

    // Get activity data for heatmap (always show if progress is allowed)
    let activityData: any[] = []
    if (isOwnProfile || privacySettings.showProgress !== false) {
      activityData = await getActivityData(user._id!.toString())
    }

    // Return user data without password
    // If it's own profile, always show all data. Otherwise, respect privacy settings
    return NextResponse.json({
      _id: user._id!.toString(),
      username: user.username,
      name: user.name,
      totalPoints: isOwnProfile || privacySettings.showPoints !== false ? user.totalPoints : undefined,
      currentStreak: isOwnProfile || privacySettings.showStreak !== false ? user.currentStreak : undefined,
      longestStreak: isOwnProfile || privacySettings.showStreak !== false ? user.longestStreak : undefined,
      createdAt: user.createdAt,
      progressData,
      activityData,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

