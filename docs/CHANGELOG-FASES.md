# Changelog de Fases — VeriFiBIN 3.0 Premium

Histórico das fases de correção e alinhamento do sistema.

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
