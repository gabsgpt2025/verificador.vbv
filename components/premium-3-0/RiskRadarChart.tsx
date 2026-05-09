'use client'

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export type RadarDimensionKey =
  | 'binRisk'
  | 'geographicRisk'
  | 'behavioralRisk'
  | 'gatewayRisk'
  | 'temporalRisk'
  | 'deviceRisk'

export type RadarDimension = {
  key: RadarDimensionKey
  label: string
  score: number
  dataAvailable: boolean
}

type RiskRadarChartProps = {
  dimensions: RadarDimension[]
  overallScore: number
}

export function getRadarColor(overallScore: number) {
  if (overallScore < 30) return '#22c55e'
  if (overallScore < 60) return '#eab308'
  if (overallScore < 80) return '#f97316'
  return '#ef4444'
}

export function normalizeDimensions(dimensions: RadarDimension[]) {
  return dimensions.map((dimension) => ({
    ...dimension,
    availableScore: dimension.dataAvailable ? dimension.score : undefined,
    unavailableScore: dimension.dataAvailable ? undefined : dimension.score,
  }))
}

export function RiskRadarChart({ dimensions, overallScore }: RiskRadarChartProps) {
  const color = getRadarColor(overallScore)
  const data = normalizeDimensions(dimensions)

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="riskRadarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.5} />
              <stop offset="95%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [`${value}/100`, 'Score']}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
            }}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as (RadarDimension & { dataAvailable: boolean }) | undefined
              if (!item) return ''
              return `${item.label} • dados ${item.dataAvailable ? 'disponíveis' : 'indisponíveis'}`
            }}
          />
          <Radar dataKey="availableScore" stroke={color} fill="url(#riskRadarFill)" fillOpacity={1} />
          <Radar dataKey="unavailableScore" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" fillOpacity={0} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RiskRadarChart
