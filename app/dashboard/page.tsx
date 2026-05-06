import { requireAuth, getUserProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CyberStatsCard } from "@/components/cyberpunk/cyber-stats-card"
import { CyberHeading, CyberText } from "@/components/cyberpunk/cyber-typography"
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
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <CyberHeading level={2} className="mb-2">
            WELCOME BACK, {profile?.full_name || user.email}
          </CyberHeading>
          <CyberText color="muted">Here's what's happening with your BIN verifications today.</CyberText>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <CyberStatsCard
            title="AVAILABLE CREDITS"
            value={profile?.credits || 0}
            change={`${creditsUsed} used this month`}
            changeType="neutral"
            icon={<CreditCard className="h-5 w-5" />}
          />

          <CyberStatsCard
            title="TOTAL VERIFICATIONS"
            value={totalVerifications}
            change="All time verifications"
            changeType="positive"
            icon={<Shield className="h-5 w-5" />}
          />

          <CyberStatsCard
            title="SUCCESS RATE"
            value="99.2%"
            change="Last 30 days"
            changeType="positive"
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <CyberStatsCard
            title="ACCOUNT STATUS"
            value={profile?.is_active ? "ACTIVE" : "INACTIVE"}
            change={profile?.role === "admin" ? "Administrator" : "Standard User"}
            changeType={profile?.is_active ? "positive" : "negative"}
            icon={<CheckCircle className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-mono text-primary neon-glow">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>BIN VERIFICATION</span>
                </CardTitle>
                <CardDescription className="font-mono">
                  Enter a BIN number to get detailed card information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BinVerificationWidget userId={user.id} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-mono text-secondary neon-glow">
                  <Activity className="h-5 w-5 text-secondary" />
                  <span>RECENT ACTIVITY</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 cyber-card">
                        <div className="p-1 bg-primary/20 rounded-full border border-primary/30">
                          <Clock className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CyberText variant="caption" className="font-medium">
                            {activity.activity_description}
                          </CyberText>
                          <CyberText variant="caption" color="muted">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </CyberText>
                        </div>
                      </div>
                    ))
                  ) : (
                    <CyberText color="muted">No recent activity</CyberText>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {verifications && verifications.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-accent neon-glow">RECENT VERIFICATIONS</CardTitle>
                <CardDescription className="font-mono">Your latest BIN verification results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verifications.map((verification) => (
                    <div key={verification.id} className="flex items-center justify-between p-4 cyber-card">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CyberText variant="body" className="font-medium">
                            BIN: {verification.bin_number}
                          </CyberText>
                          <CyberText variant="caption" color="muted">
                            {verification.card_brand} • {verification.card_type}
                          </CyberText>
                        </div>
                      </div>
                      <div className="text-right">
                        <CyberText variant="caption" className="font-medium">
                          {verification.credits_used} credit
                        </CyberText>
                        <CyberText variant="caption" color="muted">
                          {new Date(verification.created_at).toLocaleDateString()}
                        </CyberText>
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
