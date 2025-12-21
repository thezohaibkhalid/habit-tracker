import { NextRequest, NextResponse } from "next/server"
import { searchUsers } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const limit = Number.parseInt(searchParams.get("limit") || "10")

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
  }

  try {
    // Get current user to exclude from search results
    const currentUser = await getCurrentUser()
    const excludeUserId = currentUser?._id?.toString()
    
    const users = await searchUsers(query, limit, excludeUserId)
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}

