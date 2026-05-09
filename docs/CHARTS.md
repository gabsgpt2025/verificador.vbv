# CHARTS — VeriFiBIN 3.2

## Catálogo

- `RiskGauge` — score geral 0–100 com zonas (baixo/médio/alto/crítico).
- `RiskRadar` — radar 6 dimensões com eixo indisponível em `—`.
- `ScoreComposition` — donut de pesos por dimensão (ruleset v3.x.x).
- `FraudSparkline` — histórico temporal; sem série real => card indisponível.
- `PeerComparisonBar` — posição do BIN versus pares (quando houver distribuição real).
- `ComplianceHeatmap` — semáforo de compliance com evidência.
- `DataSourceBadges` — selos de fontes com tooltip de timestamp/versão.

## Regras de UX

- Não inventar valores quando não há dado real.
- Estado vazio explícito em todos os gráficos.
- Estado de erro com CTA **Tentar novamente**.
- Tooltips em PT-BR com fonte/timestamp quando disponíveis.
- Mobile-first: radar tem versão simplificada em barras no mobile.
- Contraste e texto seguem tokens do design system.

## Exemplos rápidos

- Página integrada: `components/premium-3-0/Premium3DAnalyzer.tsx`
- Página de QA visual: `/dev/charts` (`app/dev/charts/page.tsx`)
