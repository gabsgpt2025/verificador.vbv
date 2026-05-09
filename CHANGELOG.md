# Changelog

## 2026-05-09

- Fase 2 de visualização premium: nova biblioteca de gráficos em `components/charts/` (Gauge, Radar 6D, Donut, Sparkline, Peer Comparison, Compliance Heatmap e Source Badges).
- Novo `ConfidenceBadge` reutilizável com níveis Verificado/Calculado/Estimado/Indisponível e salvaguarda para evitar "Verificado" sem `source`.
- Reorganização da tela de resultado do `Premium3DAnalyzer` em layout de painéis (hero + grid de gráficos + compliance + fatores detalhados).
- Nova rota de QA visual: `/dev/charts` (somente não-produção) com cenários de fixtures.
- Testes adicionados para charts, compliance e confidence badge, além de snapshots de layout no smoke test do `Premium3DAnalyzer`.
- Documentação adicionada: `docs/CHARTS.md` e `docs/CONFIDENCE_SYSTEM.md`.

## 2026-05-08

### Breaking changes

- Consolidado SSOT de análise: `app/api/bin-analysis` agora usa o motor canônico `lib/premium-3-0` (`runFullBinAnalysis`), removendo dependência de `src/lib/intelligence`.
- Removidos módulos legados duplicados: `lib/premium-3-0/riskEngine.ts`, `lib/premium-3-0/binIntelligence.ts`, `lib/premium-3-0/threeDSEngine.ts` e diretório `src/lib/intelligence/`.
- Pipeline de pacotes padronizado em pnpm: removido `package-lock.json`; `package.json` agora declara `"packageManager": "pnpm@9.15.0"`; CI alinhada para pnpm 9.15.0 com `--frozen-lockfile` para manter consistência com Vercel/frozen lockfile.
- Regeneração do lockfile sincronizou o specifier de `@supabase/supabase-js` para `^2.105.3` conforme `package.json` (sem mudança adicional manual de dependência).

## 2026-05-06

- Adicionado modo de linguagem da análise de BIN (Analista / Comerciante / Ambos) com persistência em `localStorage` (`verifibin:analysisMode`).
- Nova camada de UX no painel Avançado com resumo executivo, semáforo, barra de risco segmentada e explicação dinâmica "Por que essa nota?".
- Inclusão de glossário técnico-popular centralizado para tradução de termos e tooltips explicativos.
