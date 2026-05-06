import { requireAuth, getUserProfile } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CurrencyConverterWidget } from "@/components/bin-pro/currency-converter-widget"
import { CyberHeading, CyberText } from "@/components/cyberpunk/cyber-typography"
import { DollarSign, TrendingUp, Globe } from "lucide-react"

export default async function CurrencyPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <CyberHeading level={2} className="mb-0">
              CURRENCY CONVERTER
            </CyberHeading>
          </div>
          <CyberText color="muted" className="text-lg">
            Real-time currency conversion with 30+ supported currencies
          </CyberText>

          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-secondary" />
              <CyberText variant="caption" color="secondary">
                30+ Currencies
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <CyberText variant="caption" color="accent">
                Real-time Rates
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <CyberText variant="caption" color="primary">
                Free to Use
              </CyberText>
            </div>
          </div>
        </div>

        <CurrencyConverterWidget />
      </main>
    </div>
  )
}
