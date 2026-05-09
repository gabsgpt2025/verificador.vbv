import { notFound } from 'next/navigation'

import {
  ComplianceHeatmap,
  DataSourceBadges,
  FraudSparkline,
  PeerComparisonBar,
  RiskGauge,
  RiskRadar,
  ScoreComposition,
} from '@/components/charts'

const now = new Date().toISOString()

const fullRadar = [
  { key: 'binRisk', label: 'BIN', score: 24, dataAvailable: true, explanation: 'Baixa exposição histórica.' },
  { key: 'behavioralRisk', label: 'Comportamental', score: 38, dataAvailable: true, explanation: 'Volume estável.' },
  { key: 'geographicRisk', label: 'Geográfico', score: 41, dataAvailable: true, explanation: 'Região de risco moderado.' },
  { key: 'deviceRisk', label: 'Dispositivo', score: 29, dataAvailable: true, explanation: 'Dispositivo consistente.' },
  { key: 'gatewayRisk', label: 'Esquema', score: 44, dataAvailable: true, explanation: 'Sinais mistos no gateway.' },
  { key: 'temporalRisk', label: 'Temporal', score: 33, dataAvailable: true, explanation: 'Janelas regulares de compra.' },
] as const

export default function DevChartsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">QA visual — gráficos Fase 2</h1>

      <section className="grid gap-4 lg:grid-cols-2">
        <RiskGauge score={45} confirmedSources={2} totalSources={3} source="Neutrino" computedAt={now} confidence={{ level: 'VERIFIED', source: 'Neutrino' }} />
        <RiskGauge score={92} confirmedSources={1} totalSources={3} source="Mastercard" computedAt={now} confidence={{ level: 'ESTIMATED', source: 'Mastercard', margin: '±12' }} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RiskRadar dimensions={[...fullRadar]} medianPeer={52} source="Regras v3.2" computedAt={now} confidence={{ level: 'CALCULATED', source: 'Ruleset' }} />
        </div>
        <ScoreComposition
          entries={[
            { key: 'bin', label: 'BIN', weight: 0.3 },
            { key: 'geo', label: 'Geográfico', weight: 0.2 },
            { key: 'behavior', label: 'Comportamental', weight: 0.15 },
            { key: 'device', label: 'Dispositivo', weight: 0.15 },
            { key: 'gateway', label: 'Esquema', weight: 0.1 },
            { key: 'temporal', label: 'Temporal', weight: 0.1 },
          ]}
          rulesetVersion="v3.2.0"
          confidence={{ level: 'CALCULATED', source: 'Ruleset v3.2.0' }}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <PeerComparisonBar
          percentile={72}
          sampleSize={420}
          distribution={[]}
          confidence={{ level: 'ESTIMATED', source: 'coorte', margin: '±10' }}
        />
        <FraudSparkline
          points={[
            { date: '2026-02-10', value: 15 },
            { date: '2026-03-10', value: 21 },
            { date: '2026-04-10', value: 18 },
            { date: '2026-05-08', value: 12, isToday: true },
          ]}
          source="Histórico BIN"
          computedAt={now}
          confidence={{ level: 'CALCULATED', source: 'histórico interno' }}
        />
      </section>

      <ComplianceHeatmap
        rows={[
          { framework: 'PCI-DSS 4.0', status: 'verified', verifiedBy: 'Auditoria interna', evidenceUrl: 'https://example.com/pci', lastCheckedAt: now },
          { framework: 'LGPD', status: 'partial', source: 'Revisão legal', lastCheckedAt: now },
          { framework: '3DS 2.2', status: 'partial', source: 'Mandato regional', lastCheckedAt: now },
          { framework: 'EMV 3DS', status: 'not_applicable', source: 'Sem cobertura', lastCheckedAt: now },
          { framework: 'PSD2 SCA', status: 'non_compliant', source: 'Pendência', lastCheckedAt: now },
          { framework: 'Bacen Resolução X', status: 'not_applicable', source: 'Fora do escopo', lastCheckedAt: now },
        ]}
        confidence={{ level: 'ESTIMATED', source: 'fontes mistas', margin: '±8' }}
      />

      <DataSourceBadges
        sources={[
          { name: 'Neutrino', status: 'ok', latencyMs: 124, responseTimestamp: now, responseVersion: 'v1' },
          { name: 'Mastercard BIN', status: 'ok', latencyMs: 287, responseTimestamp: now, responseVersion: 'v3' },
          { name: 'BinList', status: 'warning', note: 'timeout', responseTimestamp: now },
          { name: 'Bacen', status: 'neutral', note: 'não consultado', responseTimestamp: now },
        ]}
      />
    </main>
  )
}
