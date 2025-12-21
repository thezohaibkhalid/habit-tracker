import { NextRequest, NextResponse } from "next/server"
import { checkUsernameAvailability } from "@/lib/db-utils"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 })
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!usernameRegex.test(username)) {
    return NextResponse.json({ available: false, error: "Username must be 3-20 characters and contain only letters, numbers, and underscores" })
  }

  try {
    const available = await checkUsernameAvailability(username)
    return NextResponse.json({ available })
  } catch (error) {
    console.error("Error checking username:", error)
    return NextResponse.json({ error: "Failed to check username availability" }, { status: 500 })
  }
}

