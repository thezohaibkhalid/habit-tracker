import { NextRequest, NextResponse } from "next/server"
import { getProgressData } from "@/app/actions/analytics"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 })
  }

  try {
    const data = await getProgressData(startDate, endDate)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching progress data:", error)
    return NextResponse.json({ error: "Failed to fetch progress data" }, { status: 500 })
  }
}

