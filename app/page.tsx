import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CyberHeading, CyberText } from "@/components/cyberpunk/cyber-typography"
import { Shield, ArrowRight, Zap, Lock, BarChart3 } from "lucide-react"
import Link from "next/link"

// DEV MODE: Set to true to bypass authentication during development
const DEV_MODE_SKIP_AUTH = true

export default async function HomePage() {
  // Dev mode: redirect directly to dashboard
  if (DEV_MODE_SKIP_AUTH) {
    redirect("/dashboard")
  }

  const user = await getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="cyber-card border-b-0 rounded-none">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 cyber-button rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <CyberHeading level={2} className="text-2xl">
              VeriFiBIN
            </CyberHeading>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" className="font-mono">
              <Link href="/auth/login">SIGN IN</Link>
            </Button>
            <Button asChild variant="accent" className="font-mono">
              <Link href="/auth/register">GET STARTED</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <CyberHeading level={1} className="mb-6 text-balance">
            PROFESSIONAL BIN VERIFICATION PLATFORM
          </CyberHeading>
          <CyberText variant="body" color="muted" className="text-xl mb-8 text-pretty">
            Verify Bank Identification Numbers with precision and speed. Get detailed card information, issuer data, and
            fraud risk assessment in real-time.
          </CyberText>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 font-mono">
              <Link href="/auth/register">
                START VERIFYING NOW
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="text-lg px-8 font-mono">
              <Link href="/auth/login">ACCESS DASHBOARD</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <CyberHeading level={3} className="text-center mb-12">
            WHY CHOOSE VERIFIBIN?
          </CyberHeading>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group">
              <CardHeader>
                <div className="p-3 bg-primary/20 rounded-lg w-fit border border-primary/30 neon-glow">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-mono text-primary">INSTANT BIN VERIFICATION</CardTitle>
                <CardDescription className="font-mono">
                  Get comprehensive card information including brand, type, level, and issuer details in milliseconds.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group">
              <CardHeader>
                <div className="p-3 bg-secondary/20 rounded-lg w-fit border border-secondary/30 neon-glow">
                  <Lock className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="font-mono text-secondary">ADVANCED SECURITY</CardTitle>
                <CardDescription className="font-mono">
                  Enterprise-grade security with audit logs, session management, and fraud risk assessment capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group">
              <CardHeader>
                <div className="p-3 bg-accent/20 rounded-lg w-fit border border-accent/30 neon-glow">
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="font-mono text-accent">DETAILED ANALYTICS</CardTitle>
                <CardDescription className="font-mono">
                  Track usage patterns, monitor verification trends, and access comprehensive reporting tools.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 cyber-card">
              <div className="text-4xl font-bold text-primary mb-2 neon-glow font-mono">99.9%</div>
              <CyberText color="muted">ACCURACY RATE</CyberText>
            </div>
            <div className="p-6 cyber-card">
              <div className="text-4xl font-bold text-secondary mb-2 neon-glow font-mono">&lt;100ms</div>
              <CyberText color="muted">RESPONSE TIME</CyberText>
            </div>
            <div className="p-6 cyber-card">
              <div className="text-4xl font-bold text-accent mb-2 neon-glow font-mono">24/7</div>
              <CyberText color="muted">SUPPORT AVAILABLE</CyberText>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-r from-primary/20 via-secondary/10 to-accent/20 border-y border-border">
        <div className="container mx-auto text-center max-w-3xl">
          <CyberHeading level={3} className="mb-6">
            READY TO START VERIFYING?
          </CyberHeading>
          <CyberText variant="body" className="text-xl mb-8 text-pretty">
            Join thousands of businesses that trust VeriFiBIN for their BIN verification needs.
          </CyberText>
          <Button asChild size="lg" variant="accent" className="text-lg px-8 font-mono">
            <Link href="/auth/register">CREATE YOUR ACCOUNT</Link>
          </Button>
        </div>
      </section>

      <footer className="cyber-card border-t-0 rounded-none py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-2 cyber-button rounded-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <CyberHeading level={4} className="text-lg">
              VeriFiBIN
            </CyberHeading>
          </div>
          <CyberText color="muted">© 2024 VeriFiBIN. Professional BIN verification platform.</CyberText>
        </div>
      </footer>
    </div>
  )
}
