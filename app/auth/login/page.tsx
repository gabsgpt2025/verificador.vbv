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
import { Shield, AlertCircle, UserCheck, ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [bypassLoading, setBypassLoading] = useState<"admin" | "user" | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Log successful login activity
      await supabase.rpc("log_user_activity", {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_activity_type: "login_success",
        p_activity_description: "User logged in successfully",
      })

      router.push("/dashboard")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setError(errorMessage)

      // Log failed login attempt
      await supabase.from("failed_login_attempts").insert({
        email,
        reason: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // TODO: REMOVER - bypass temporário de senha
  // Botões de acesso direto sem validação de credenciais
  const handleBypassLogin = async (role: "admin" | "user") => {
    setBypassLoading(role)
    setError(null)
    router.push(`/api/auth/bypass?role=${role}`)
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

        {/* TODO: REMOVER - bypass temporário de senha */}
        {/* Seção de acesso rápido sem senha — remover antes de ir para produção */}
        <Card className="mb-4 border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-yellow-500 text-center">⚠ ACESSO TEMPORÁRIO SEM SENHA</CardTitle>
            <CardDescription className="text-center text-xs font-mono">
              Clique para entrar diretamente sem credenciais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full font-mono border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
              onClick={() => handleBypassLogin("admin")}
              disabled={bypassLoading !== null}
              aria-label="Entrar como Admin — acesso temporário de desenvolvimento sem senha"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {bypassLoading === "admin" ? "ENTRANDO..." : "ENTRAR COMO ADMIN"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full font-mono border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
              onClick={() => handleBypassLogin("user")}
              disabled={bypassLoading !== null}
              aria-label="Entrar como Usuário — acesso temporário de desenvolvimento sem senha"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              {bypassLoading === "user" ? "ENTRANDO..." : "ENTRAR COMO USUÁRIO"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center font-mono text-primary neon-glow">SIGN IN</CardTitle>
            <CardDescription className="text-center font-mono">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {isLoading ? "SIGNING IN..." : "SIGN IN"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <CyberText color="muted">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium neon-glow">
                  Create account
                </Link>
              </CyberText>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
