import { NextRequest, NextResponse } from "next/server"
import { getUserByUsername } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"
import { getProgressData, getActivityData } from "@/app/actions/analytics"
import { subDays } from "date-fns"
import { getPakistanTime, getPakistanDateString } from "@/lib/time-utils"

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

    let progressData: any[] = []
    if (isOwnProfile || privacySettings.showProgress !== false) {
      const endDate = getPakistanDateString()
      const startDate = getPakistanDateString(subDays(getPakistanTime(), 30))
      progressData = await getProgressData(startDate, endDate, user._id!.toString())
    }

    let activityData: any[] = []
    if (isOwnProfile || privacySettings.showProgress !== false) {
      activityData = await getActivityData(user._id!.toString())
    }
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

