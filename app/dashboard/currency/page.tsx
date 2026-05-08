import { DollarSign, Globe, TrendingUp } from 'lucide-react'

import { CurrencyConverterWidget } from '@/components/bin-pro/currency-converter-widget'
import { CyberHeading, CyberText } from '@/components/cyberpunk/cyber-typography'
import { requireAuth } from '@/lib/auth'

export default async function CurrencyPage() {
  await requireAuth()

  return (
    <div>
      <div className="mb-8">
        <div className="mb-4 flex items-center space-x-3">
          <div className="rounded-lg border border-primary/30 bg-primary/20 p-2">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <CyberHeading level={2} className="mb-0">
            CURRENCY CONVERTER
          </CyberHeading>
        </div>
        <CyberText color="muted" className="text-lg">
          Real-time currency conversion with 30+ supported currencies
        </CyberText>

        <div className="mt-4 flex items-center space-x-6">
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
    </div>
  )
}
