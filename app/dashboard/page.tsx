import { Activity, CheckCircle, Clock, CreditCard, Shield, TrendingUp } from 'lucide-react'

import { BinVerificationWidget } from '@/components/dashboard/bin-verification-widget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { MetricCard } from '@/components/ui/metric-card'
import { RiskIndicator } from '@/components/ui/risk-indicator'
import { formatNumber, formatRelativeTime } from '@/lib/format'
import { getUserProfile, requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  const supabase = await createClient()

  const { data: verifications } = await supabase
    .from('bin_verifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentActivity } = await supabase
    .from('user_activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const totalVerifications = verifications?.length || 0
  const creditsUsed = verifications?.reduce((sum, verification) => sum + verification.credits_used, 0) || 0
  const lastRiskScore = verifications?.[0]?.risk_score as number | undefined

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-fg">Welcome back, {profile?.full_name || user.email}</h2>
        <p className="text-sm text-fg-muted">Here&apos;s what&apos;s happening with your BIN verifications today.</p>
      </div>

      <div className="grid grid-cols-1 gap-[var(--gap-base)] md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Available Credits"
          value={profile?.credits || 0}
          formatAs="number"
          delta={{ value: -creditsUsed, label: `${formatNumber(creditsUsed)} usados no mês`, direction: 'neutral' }}
          icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Total Verifications"
          value={totalVerifications}
          formatAs="number"
          delta={{ value: 12, label: 'Últimos 30 dias', direction: 'up' }}
          icon={<Shield className="h-5 w-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Success Rate"
          value={99.2}
          formatAs="percent"
          delta={{ value: 3.2, label: 'Últimos 30 dias', direction: 'up' }}
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Account Status"
          value={profile?.is_active ? 'Active' : 'Inactive'}
          formatAs="text"
          delta={{ value: profile?.is_active ? 1 : -1, label: profile?.role === 'admin' ? 'Administrator' : 'Standard User' }}
          icon={<CheckCircle className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-fg">
                <Shield className="h-5 w-5 text-ds-accent" aria-hidden="true" />
                <span>BIN Verification</span>
              </CardTitle>
              <CardDescription className="text-fg-muted text-sm">Enter a BIN number to get detailed card information</CardDescription>
            </CardHeader>
            <CardContent>
              <BinVerificationWidget userId={user.id} />
            </CardContent>
          </Card>

          <RiskIndicator
            level={typeof lastRiskScore === 'number' && lastRiskScore >= 85 ? 'critical' : typeof lastRiskScore === 'number' && lastRiskScore >= 65 ? 'high' : typeof lastRiskScore === 'number' && lastRiskScore >= 40 ? 'medium' : 'low'}
            score={lastRiskScore}
            variant="card"
            tooltip="Indicador visual de risco antifraude com score numérico."
          />
        </div>

        <div>
          <Card>
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
                    <div key={activity.id} className="flex items-start space-x-3 rounded-lg border border-border-subtle bg-bg-surface-elevated p-3">
                      <div className="flex-shrink-0 rounded-full border border-ds-accent/20 bg-ds-accent/10 p-1">
                        <Clock className="h-3 w-3 text-ds-accent" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-fg">{activity.activity_description}</p>
                        <p className="text-xs text-fg-muted">{formatRelativeTime(activity.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Sem atividade recente" description="As novas verificações aparecerão aqui assim que forem executadas." />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {verifications && verifications.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-fg">Recent Verifications</CardTitle>
            <CardDescription className="text-fg-muted text-sm">Your latest BIN verification results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verifications.map((verification) => (
                <div key={verification.id} className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-surface-elevated p-4 transition-colors hover:bg-bg-surface-hover">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-lg border border-ds-accent/20 bg-ds-accent/10 p-2">
                      <CreditCard className="h-4 w-4 text-ds-accent" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fg">BIN: {verification.bin_number}</p>
                      <p className="text-xs text-fg-muted">{verification.card_brand} {'•'} {verification.card_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-fg">{verification.credits_used} credit</p>
                    <p className="text-xs text-fg-muted">{formatRelativeTime(verification.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
