// [DESIGN-SYSTEM] Página-piloto refatorada para tokens semânticos (Fase 1).
// Demais páginas serão migradas nas Fases 4.x conforme docs/design/README.md
import { requireAuth, getUserProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "./_components/stats-card"
import { CreditCard, Activity, TrendingUp, Shield, Clock, CheckCircle } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BinVerificationWidget } from "@/components/dashboard/bin-verification-widget"

export default async function DashboardPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  const supabase = await createClient()

  // Get user stats
  const { data: verifications } = await supabase
    .from("bin_verifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: recentActivity } = await supabase
    .from("user_activity_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const totalVerifications = verifications?.length || 0
  const creditsUsed = verifications?.reduce((sum, v) => sum + v.credits_used, 0) || 0

  return (
    <div className="min-h-screen bg-bg-app">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-fg tracking-wide mb-2">
            Welcome back, {profile?.full_name || user.email}
          </h2>
          <p className="text-sm text-fg-muted">Here&apos;s what&apos;s happening with your BIN verifications today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Available Credits"
            value={profile?.credits || 0}
            change={`${creditsUsed} used this month`}
            changeType="neutral"
            icon={<CreditCard className="h-5 w-5" aria-label="Credits icon" />}
          />

          <StatsCard
            title="Total Verifications"
            value={totalVerifications}
            change="All time verifications"
            changeType="positive"
            icon={<Shield className="h-5 w-5" aria-label="Shield icon" />}
          />

          <StatsCard
            title="Success Rate"
            value="99.2%"
            change="Last 30 days"
            changeType="positive"
            icon={<TrendingUp className="h-5 w-5" aria-label="Trending up icon" />}
          />

          <StatsCard
            title="Account Status"
            value={profile?.is_active ? "Active" : "Inactive"}
            change={profile?.role === "admin" ? "Administrator" : "Standard User"}
            changeType={profile?.is_active ? "positive" : "negative"}
            icon={<CheckCircle className="h-5 w-5" aria-label="Account status icon" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-bg-surface border border-border-subtle rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-fg">
                  <Shield className="h-5 w-5 text-ds-accent" aria-hidden="true" />
                  <span>BIN Verification</span>
                </CardTitle>
                <CardDescription className="text-fg-muted text-sm">
                  Enter a BIN number to get detailed card information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BinVerificationWidget userId={user.id} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-bg-surface border border-border-subtle rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-fg">
                  <Activity className="h-5 w-5 text-ds-accent" aria-hidden="true" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 bg-bg-surface-elevated border border-border-subtle rounded-lg"
                      >
                        <div className="p-1 bg-ds-accent/10 rounded-full border border-ds-accent/20 flex-shrink-0">
                          <Clock className="h-3 w-3 text-ds-accent" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-fg">{activity.activity_description}</p>
                          <p className="text-xs text-fg-muted">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-fg-muted">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {verifications && verifications.length > 0 && (
          <div className="mt-8">
            <Card className="bg-bg-surface border border-border-subtle rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-fg">Recent Verifications</CardTitle>
                <CardDescription className="text-fg-muted text-sm">
                  Your latest BIN verification results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {verifications.map((verification) => (
                    <div
                      key={verification.id}
                      className="flex items-center justify-between p-4 bg-bg-surface-elevated border border-border-subtle rounded-lg hover:bg-bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-ds-accent/10 rounded-lg border border-ds-accent/20">
                          <CreditCard className="h-4 w-4 text-ds-accent" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-fg">BIN: {verification.bin_number}</p>
                          <p className="text-xs text-fg-muted">
                            {verification.card_brand} &bull; {verification.card_type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-fg">{verification.credits_used} credit</p>
                        <p className="text-xs text-fg-muted">
                          {new Date(verification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
