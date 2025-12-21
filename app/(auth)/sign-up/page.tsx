"use client"

import { useState, useEffect, useRef } from "react"
import { signUp } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react"

export default function SignUpPage() {
  const [username, setUsername] = useState("")
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")
  const [error, setError] = useState<string | null>(null)
  const checkTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear previous timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current)
    }

    if (!username) {
      setUsernameStatus("idle")
      return
    }

    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      setUsernameStatus("invalid")
      return
    }

    // Debounce API call
    setUsernameStatus("checking")
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/username/check?username=${encodeURIComponent(username)}`)
        const data = await response.json()
        
        if (data.available) {
          setUsernameStatus("available")
        } else {
          setUsernameStatus("taken")
        }
      } catch (error) {
        setUsernameStatus("idle")
      }
    }, 500)

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
    }
  }, [username])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (usernameStatus !== "available") {
      setError("Please choose an available username")
      return
    }

    const formData = new FormData(e.currentTarget)
    const result = await signUp(formData)

    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center">
              <span className="text-white dark:text-slate-900 font-bold text-lg">BH</span>
            </div>
            <CardTitle className="text-2xl font-bold">Bit Habits</CardTitle>
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  className="pr-10"
                  maxLength={20}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {usernameStatus === "available" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {usernameStatus === "taken" && <XCircle className="h-4 w-4 text-destructive" />}
                  {usernameStatus === "invalid" && username.length > 0 && (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              {usernameStatus === "available" && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Username is available!</p>
              )}
              {usernameStatus === "taken" && (
                <p className="text-xs text-destructive">Username is already taken</p>
              )}
              {usernameStatus === "invalid" && username.length > 0 && (
                <p className="text-xs text-destructive">Username must be 3-20 characters (letters, numbers, underscores only)</p>
              )}
              {username.length > 0 && username.length < 3 && (
                <p className="text-xs text-muted-foreground">At least 3 characters required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={usernameStatus !== "available"}>
              Create account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
