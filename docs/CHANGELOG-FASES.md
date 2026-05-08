# Changelog de Fases — VeriFiBIN 3.0 Premium

Histórico das fases de correção e alinhamento do sistema.

---

## Fase 5 — Runtime Infra (Cache + Circuit Breaker + Retry) (2026-05-08)

### Mudanças

- **Criado** `lib/premium-3-0/runtime/` com os módulos `cache/`, `circuitBreaker.ts`, `retry.ts`, `resilientFetch.ts` e `metrics.ts`.
- **Adicionada** camada de cache pluggable com implementação default em memória (`memoryCache`) e adapter preparado para Upstash (`upstashCache`) sem nova dependência obrigatória.
- **Adicionado** `CircuitBreaker` com registry singleton por operação, timeout, transições `CLOSED → OPEN → HALF_OPEN` e métricas de rejeição.
- **Adicionado** `withRetry()` com backoff exponencial, jitter opcional e proteção para não repetir erros `4xx` nem `CircuitOpenError`.
- **Adicionado** `resilientFetch()` para compor cache + breaker + retry + parse tipado em um único helper reutilizável por providers.
- **Adicionado** coletor in-memory em `lib/premium-3-0/runtime/metrics.ts` com ring buffer de até 1000 amostras por `(provider, operation)`.
- **Criado** endpoint protegido `app/api/admin/runtime-metrics/route.ts`, habilitado apenas quando `ADMIN_METRICS_KEY` estiver configurada.
- **Refatorado** `lib/premium-3-0/neutrino-api.ts` para usar `resilientFetch()` no `bin-lookup`, com cache de 7 dias e retry idempotente.
- **Atualizado** `.env.example` com `ADMIN_METRICS_KEY` e placeholders comentados para Upstash.
- **Adicionados** testes Vitest focados em runtime infra em `tests/premium-3-0/runtime/`.

### Impacto

- **API externa**: o shape retornado por `/api/bin-analysis-v2` permanece inalterado.
- **Quota upstream**: BIN lookup da Neutrino passa a poder reaproveitar resultados por 7 dias, reduzindo chamadas repetidas.
- **Resiliência**: falhas consecutivas do upstream deixam de escalar linearmente em timeouts para o usuário.

### Próxima fase

- **Fase 5N**: ativar novos endpoints da Neutrino usando `resilientFetch()` como padrão de integração.

---

## Fase 2 — Alinhamento de tipos & contratos (2026-05-08)

### Mudanças

- **Criado** `lib/premium-3-0/holisticTypes.ts` como SSOT (fonte única de verdade) para todos os tipos públicos do contrato API ↔ UI.
- **Consolidados** os seguintes tipos canônicos em `holisticTypes.ts` (antes declarados como unions inline dispersas):
  - `RecommendationAction = "APPROVE" | "CHALLENGE" | "DECLINE" | "REVIEW"`
  - `RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"`
  - `BypassMechanism = "NONE" | "FRICTIONLESS_3DS2" | "SCA_EXEMPTION" | "3DS_NOMINAL" | "UNKNOWN"`
  - `CardBrand`, `CardType`, `CardCategory`
- **Movidos** para `holisticTypes.ts`: `BINData`, `BINAnalysisResult`, `ThreeDSAnalysis`, `FraudAlert`, `RiskFactors`, `RiskEngineResult`, `MastercardBINLookupResponse`, `MastercardIdentityInsightsResponse`, `LanguageMode`, `AnalysisRequest`, `AnalysisResponse`, `DashboardMetrics`, `HistoryEntry`.
- **Atualizado** `lib/premium-3-0/types.ts`: re-exporta todos os tipos públicos de `holisticTypes.ts` (compatibilidade total com imports existentes); mantém tipos internos do motor (`BinApiData`, `FullBinAnalysis`, etc.).
- **Adicionado** `satisfies AnalysisResponse` ao retorno de `mapFullBinAnalysisToResponse` em `lib/premium-3-0/adapters.ts`, garantindo que todos os campos obrigatórios do contrato público sejam cobertos em tempo de compilação.
- **Atualizado** `app/api/bin-analysis-v2/route.ts`:
  - Importa `AnalysisRequest` de `holisticTypes.ts`.
  - Adicionada função `validateAnalysisRequest` com schema Zod (Zod já presente no `package.json`).
  - Valida: `bin` (string, 6–8 dígitos numéricos), `transactionAmount` (≥ 0 se presente), `deviceType` (literal válido se presente).
- **Atualizado** `components/premium-3-0/Premium3DAnalyzer.tsx`: importa `AnalysisResponse` e `LanguageMode` de `holisticTypes.ts`.

### Divergências encontradas e não resolvidas

- `MastercardIdentityInsightsResponse.recommendedAction` foi corrigido de `'APPROVE' | 'CHALLENGE' | 'DECLINE'` para usar o tipo canônico `RecommendationAction` (inclui `"REVIEW"`). O motor Mastercard real não está integrado em produção, portanto nenhuma quebra de contrato externo.
- O campo `AnalysisRequest.additionalContext` foi alterado de `Record<string, any>` para `Record<string, unknown>` (mais seguro). Não há consumidores que passem esse campo atualmente.
- O campo `AnalysisRequest` anteriormente tinha todos os campos como obrigatórios; agora são opcionais (exceto `bin`), pois o endpoint real só usa `bin`. Os campos extras são validados **se presentes**.

### Impacto

- **API**: nenhuma quebra de contrato externo — o shape de resposta de `/api/bin-analysis-v2` permanece `FullBinAnalysis`.
- **UI**: imports refatorados para `holisticTypes.ts`; comportamento idêntico.
- **Build TypeScript**: `tsc --noEmit` sem erros novos.

### Próxima fase

- **Fase 3**: Hardening de endpoints — deprecação formal de `/api/bin-analysis`, `.env.example` final, revisão de segurança dos handlers.

---

## Fase 1 — Documentação base (PR #28)

Criação de `docs/VERIFIBIN-3.0-RELATORIO-TECNICO.md` e `docs/CONFORMIDADE-AUDITORIA.md` com a auditoria
inicial de conformidade entre o documento técnico e o código real. Sem alteração de código.
