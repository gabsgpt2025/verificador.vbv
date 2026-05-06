"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CyberHeading, CyberText } from "@/components/cyberpunk/cyber-typography"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Shield, AlertCircle, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/verify-email")
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-secondary mx-auto mb-4 neon-glow" />
              <CyberHeading level={3} variant="secondary" className="mb-2">
                ACCOUNT CREATED!
              </CyberHeading>
              <CyberText color="muted" className="mb-4">
                Please check your email to verify your account before signing in.
              </CyberText>
              <CyberText variant="caption" color="muted">
                Redirecting to verification page...
              </CyberText>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 cyber-button rounded-full">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CyberHeading level={1} className="text-3xl mb-2">
            VeriFiBIN
          </CyberHeading>
          <CyberText color="muted">Professional BIN Verification Platform</CyberText>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center font-mono text-primary neon-glow">CREATE ACCOUNT</CardTitle>
            <CardDescription className="text-center font-mono">
              Join VeriFiBIN and start verifying BINs today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-mono text-foreground">
                  FULL NAME
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-foreground">
                  EMAIL
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-mono text-foreground">
                  PASSWORD
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-mono text-foreground">
                  CONFIRM PASSWORD
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full font-mono"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="cyber-card border-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-mono">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full font-mono" disabled={isLoading}>
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <CyberText color="muted">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium neon-glow">
                  Sign in
                </Link>
              </CyberText>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
