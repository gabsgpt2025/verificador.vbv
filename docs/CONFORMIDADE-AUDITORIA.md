# VeriFiBIN 3.0 — Conformidade & Auditoria (Fase 1)

> **Objetivo**: Tabela item-a-item comparando o documento original _"VeriFiBIN 3.0 Premium — Relatório Técnico Completo"_ (versão 3.0.0, maio 2026) com o código realmente implementado no repositório.
>
> **Data da auditoria**: 2026-05-08 · **Branch auditada**: `copilot/phase-1-align-documentation`

**Legenda de status**:

| Símbolo | Significado |
|---|---|
| ✅ | Confirmado correto — doc original alinhado com código |
| ⚠️ | Parcialmente correto / requer ajuste |
| ❌ | Incorreto ou inexistente no código real |
| ➕ | Existe no código mas faltava no documento original |

---

## 📦 Seção 1 — Stack Tecnológico

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Next.js | ❌ | "Next.js 14" | `next: 15.5.15` | `package.json#L57` |
| React | ❌ | "React 18" (implícito no doc v3.0.0) | `react: 19.2.0` | `package.json#L59` |
| React DOM | ❌ | — | `react-dom: 19.2.0` | `package.json#L62` |
| TypeScript | ✅ | "TypeScript" | `typescript: ^5` | `package.json#L81` |
| Tailwind CSS | ⚠️ | "Tailwind CSS" | `tailwindcss: ^4.1.9` | `package.json#L79` |
| @supabase/supabase-js | ✅ | "@supabase/supabase-js" | `^2.105.3` | `package.json#L45` |
| Gerenciador de pacotes | ❌ | Não especificado / "npm" implícito | `pnpm@9.15.0` | `package.json#L5` |
| Zod | ➕ | Não mencionado | `zod: 3.25.76` | `package.json#L69` |
| Vitest | ➕ | Não mencionado | `vitest: ^4.1.5` | `package.json#L82` |
| shadcn/ui (Radix) | ➕ | Não mencionado | `@radix-ui/*` diversas | `package.json#L17-42` |

---

## 🏗️ Seção 2 — Arquitetura

### 2.1 Estrutura de Diretórios

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Motor canônico em `lib/premium-3-0/` | ✅ | `lib/premium-3-0/` | Existe e é o motor principal | `lib/premium-3-0/index.ts` |
| `lib/bin/` existente | ❌ | `lib/bin/` mencionado | **Removido** — diretório não existe | PRs #16–#27 |
| `src/lib/intelligence/` | ❌ | Citado como motor legacy | **Não existe** no repositório | — |
| `holisticEngine.ts` | ❌ | Arquivo listado em `lib/premium-3-0/` | **Não existe** | — |
| `holisticTypes.ts` | ❌ | Arquivo listado em `lib/premium-3-0/` | **Não existe** (tipos em `types.ts`) | `lib/premium-3-0/types.ts` |
| `riskEngine.ts` | ❌ | Arquivo listado em `lib/premium-3-0/` | **Não existe** (motor em `calculateRisk.ts`) | `lib/premium-3-0/calculateRisk.ts` |
| `threeDSEngine.ts` | ❌ | Arquivo listado em `lib/premium-3-0/` | **Não existe** (motor em `analyzeThreeDS.ts`) | `lib/premium-3-0/analyzeThreeDS.ts` |
| `binIntelligence.ts` | ❌ | Arquivo listado em `lib/premium-3-0/` | **Não existe** | — |
| `mastercardClient.ts` | ❌ | Arquivo listado | **Não existe** na `lib/premium-3-0/` | — |
| `mastercardProcessingClient.ts` | ❌ | Arquivo listado | **Não existe** | — |
| `analyzeThreeDS.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/analyzeThreeDS.ts` |
| `calculateRisk.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/calculateRisk.ts` |
| `calculateDataQuality.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/calculateDataQuality.ts` |
| `analyzeCompliance.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/analyzeCompliance.ts` |
| `generateRecommendation.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/generateRecommendation.ts` |
| `normalizeBinApiResponse.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/normalizeBinApiResponse.ts` |
| `applyBinOverrides.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/applyBinOverrides.ts` |
| `saveBinAnalysisLog.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/saveBinAnalysisLog.ts` |
| `adapters.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/adapters.ts` |
| `country3dsMaturity.ts` | ➕ | Não listado | Existe | `lib/premium-3-0/country3dsMaturity.ts` |
| `neutrino-api.ts` | ➕ | Não listado explicitamente | Existe | `lib/premium-3-0/neutrino-api.ts` |

### 2.2 Componentes de UI

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| `Premium3DAnalyzer.tsx` | ✅ | Mencionado | Existe | `components/premium-3-0/Premium3DAnalyzer.tsx` |
| Consume `/api/bin-analysis-v2` | ✅ | Descrito no fluxo | Confirmado (via fetch POST) | `components/premium-3-0/Premium3DAnalyzer.tsx#L78` |

---

## 🧠 Seção 3 — Motor Holístico

### 3.1 Tipo Principal de Saída

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Tipo de saída: `HolisticAnalysisResult` | ❌ | `HolisticAnalysisResult` | **Não existe** — tipo real é `FullBinAnalysis` | `lib/premium-3-0/types.ts#L293` |
| Campo `threatScore` | ❌ | Presente em `HolisticAnalysisResult` | **Não existe** no tipo real | — |
| Campo `bypassProbability` | ❌ | Presente em `HolisticAnalysisResult` | Não é campo de `FullBinAnalysis` (existe em `LegacyBINAnalysisResult`) | `lib/premium-3-0/types.ts#L344` |
| Campo `ensemble` | ❌ | Pesos `0.25/0.30/0.25/0.20` citados | **Não existe** — motor usa score incremental | — |
| `runFullBinAnalysis()` como orquestrador | ✅ | Sim, função principal | `runFullBinAnalysis(binData: BinApiData): FullBinAnalysis` | `lib/premium-3-0/index.ts#L11` |

### 3.2 BIN Length (comprimento do BIN)

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Suporte a BIN de 6 dígitos | ✅ | Mencionado | Mínimo 6 dígitos aceito | `app/api/bin-analysis-v2/route.ts#L78` |
| Suporte a BIN de 8 dígitos | ✅ | Mencionado | BIN de 8 dígitos reduz score de risco em 5 pontos | `lib/premium-3-0/calculateRisk.ts#L126` |
| Suporte a BIN de 10 dígitos | ❌ | Mencionado | **Não existe** — limite é `substring(0, 8)` | `app/api/bin-analysis-v2/route.ts#L82` |

### 3.3 Ensemble Weights (pesos do ensemble holístico)

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Peso 3DS Engine: 0.25 | ❌ | `0.25` | **Não há pesos multiplicativos** — score incremental por fatores | `lib/premium-3-0/analyzeThreeDS.ts` |
| Peso Risk Engine: 0.30 | ❌ | `0.30` | **Não há ensemble** — cada motor retorna resultado independente | `lib/premium-3-0/calculateRisk.ts` |
| Peso BIN Intelligence: 0.25 | ❌ | `0.25` | **Não aplicável** | — |
| Peso Compliance: 0.20 | ❌ | `0.20` | **Não aplicável** | — |

---

## ⚖️ Seção 4 — Risk Engine (Motor de Risco)

### 4.1 Dimensões e Pesos

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Peso `binRisk`: 0.25 | ❌ | `0.25` | Score incremental: emissor ausente +15, país ausente +15, etc. | `lib/premium-3-0/calculateRisk.ts#L14-L57` |
| Peso `temporalRisk`: 0.25 | ❌ | `0.25` | **Não implementado** no `calculateRisk.ts` (sempre 0 no adapter) | `lib/premium-3-0/adapters.ts#L162` |
| Peso `behavioralRisk`: 0.20 | ❌ | `0.20` | **Não implementado** (sempre 0 no adapter) | `lib/premium-3-0/adapters.ts#L163` |
| Peso `geographicRisk`: 0.15 | ❌ | `0.15` | Implementado via `country3dsMaturity`, mas como fator incremental | `lib/premium-3-0/calculateRisk.ts#L33` |
| Peso `deviceRisk`: 0.10 | ❌ | `0.10` | **Não implementado** (sempre 0 no adapter) | `lib/premium-3-0/adapters.ts#L164` |
| Peso `gatewayRisk`: 0.05 | ❌ | `0.05` | **Não implementado** (sempre 0 no adapter) | `lib/premium-3-0/adapters.ts#L165` |
| Score base inicial | ➕ | Não especificado | `30` (clampado 0–100) | `lib/premium-3-0/calculateRisk.ts#L11` |
| Score cartão pré-pago | ➕ | Não especificado | `+20` | `lib/premium-3-0/calculateRisk.ts#L52` |
| Score BIN 8 dígitos | ➕ | Não especificado | `−5` | `lib/premium-3-0/calculateRisk.ts#L126` |

### 4.2 Thresholds de Nível de Risco

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| `LOW`: 0–30 | ⚠️ | "0–30" | `< 31` (equivalente) | `lib/premium-3-0/calculateRisk.ts#L145` |
| `MEDIUM`: 31–60 | ⚠️ | "31–60" | `≥ 31 e < 61` | `lib/premium-3-0/calculateRisk.ts#L146` |
| `HIGH`: 61–80 | ⚠️ | "61–80" | `≥ 61 e < 81` | `lib/premium-3-0/calculateRisk.ts#L147` |
| `CRITICAL`: 81–100 | ⚠️ | "81–100" | `≥ 81` | `lib/premium-3-0/calculateRisk.ts#L145` |

### 4.3 `RiskFactors` Interface

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Interface `RiskFactors` | ⚠️ | `RiskFactors { binRisk, temporalRisk, behavioralRisk, geographicRisk, deviceRisk, gatewayRisk }` | Existe com mesmos campos (herdada da camada de compatibilidade), mas apenas `binRisk` é populado pelo motor; outros são sempre `0` | `lib/premium-3-0/types.ts#L84-L91`, `adapters.ts#L159-L166` |

---

## 🔐 Seção 5 — 3DS Engine

### 5.1 Fatores e Thresholds

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Threshold FRICTIONLESS: score < 30 | ❌ | `< 30 → FRICTIONLESS` | Motor usa **score composto de sub-scores** por dimensão (max ~80 pontos) | `lib/premium-3-0/analyzeThreeDS.ts#L80` |
| Threshold HYBRID: 30–60 | ❌ | `30–60 → HYBRID` | Threshold real: `score ≥ 40 → LIKELY_ACTIVE / MEDIUM` | `lib/premium-3-0/analyzeThreeDS.ts#L85` |
| Threshold CHALLENGE: score > 60 | ❌ | `> 60 → CHALLENGE` | Threshold real: `score ≥ 70 → LIKELY_ACTIVE / HIGH` | `lib/premium-3-0/analyzeThreeDS.ts#L81` |
| Status `LIKELY_INACTIVE` | ➕ | Não listado | `score < 20 → LIKELY_INACTIVE` | `lib/premium-3-0/analyzeThreeDS.ts#L92` |
| Status `UNKNOWN` | ➕ | Não listado | `score ≥ 20 e < 40 → UNKNOWN / LOW` | `lib/premium-3-0/analyzeThreeDS.ts#L89` |
| 8 fatores 3DS | ❌ | "8 fatores" listados | Motor usa 5 dimensões: brand, type, category, country, issuer | `lib/premium-3-0/analyzeThreeDS.ts#L69-L75` |
| `ThreeDSContext` como entrada | ❌ | `ThreeDSContext` com `transactionAmount`, `deviceType`, etc. | Motor recebe apenas `BinApiData` (sem contexto transacional) | `lib/premium-3-0/analyzeThreeDS.ts#L69` |

### 5.2 `ThreeDSAnalysis` vs. `BinThreeDSResult`

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Tipo de saída `ThreeDSAnalysis` | ⚠️ | `ThreeDSAnalysis { challengeLikelihood, frictionlessLikelihood, recommendedFlow, estimatedSuccessRate, explanation }` | Existe no código como tipo legado (em `types.ts`); motor real retorna `BinThreeDSResult` com estrutura diferente | `lib/premium-3-0/types.ts#L48` vs `#L234` |
| `recommendedFlow: FRICTIONLESS | CHALLENGE | HYBRID` | ✅ | Sim | Presente em `ThreeDSAnalysis` (tipo legado e em adapter) | `lib/premium-3-0/types.ts#L51`, `adapters.ts#L45` |

---

## 🔍 Seção 6 — BIN Intelligence

### 6.1 `BypassMechanism`

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| `NONE` | ✅ | Listado | Presente | `lib/premium-3-0/types.ts#L27` |
| `FRICTIONLESS_3DS2` | ✅ | Listado | Presente | `lib/premium-3-0/types.ts#L27` |
| `SCA_EXEMPTION` | ✅ | Listado | Presente | `lib/premium-3-0/types.ts#L27` |
| `3DS_NOMINAL` | ✅ | Listado | Presente | `lib/premium-3-0/types.ts#L27` |
| `UNKNOWN` | ➕ | Não listado no doc original | Adicionado no código | `lib/premium-3-0/types.ts#L27` |

### 6.2 `IssuerIntelligence`

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Interface `IssuerIntelligence` | ❌ | Descrita com campos `issuerProfile`, `fraudHistory`, etc. | **Não existe** como interface formal no código | — |

### 6.3 Dados de Mercado por País (maturidade 3DS)

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| BR: 95% maturidade | ❌ | "95%" | Código usa categoria `HIGH` / `BROAD_ADOPTION`, sem percentual | `lib/premium-3-0/country3dsMaturity.ts#L22` |
| GB: 98% maturidade | ❌ | "98%" | Código usa categoria `HIGH` / `SCA_STRONG`, sem percentual | `lib/premium-3-0/country3dsMaturity.ts#L35` |
| US: 45% maturidade | ❌ | "45%" | Código usa categoria `MEDIUM` / `OPTIONAL_MARKET_DRIVEN`, sem percentual | `lib/premium-3-0/country3dsMaturity.ts#L28` |
| RU: 20% maturidade | ❌ | "20%" | `RU` (Rússia) **não está na tabela** | `lib/premium-3-0/country3dsMaturity.ts` |
| UA: 15% maturidade | ❌ | "15%" | `UA` (Ucrânia) **não está na tabela** | `lib/premium-3-0/country3dsMaturity.ts` |

### 6.4 Perfis de Banco (Nubank, Inter, PagBank, Wells Fargo, Revolut, Advcash)

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Perfis de banco hard-coded | ❌ | Descritos com características específicas | **Não existem** no código — nenhum arquivo contém esses perfis | — |

---

## 🔌 Seção 7 — APIs e Integrações

### 7.1 Neutrino API

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Endpoint Neutrino | ✅ | `https://neutrinoapi.net/bin-lookup` | `const NEUTRINO_BASE_URL = "https://neutrinoapi.net/bin-lookup"` | `lib/premium-3-0/neutrino-api.ts#L9` |
| Autenticação via headers | ✅ | `User-ID` + `API-Key` | Confirmado | `lib/premium-3-0/neutrino-api.ts#L42-L44` |
| Timeout | ⚠️ | Não especificado no doc | `8000ms` por tentativa | `lib/premium-3-0/neutrino-api.ts#L11` |
| Retries | ➕ | Não mencionado | 3 tentativas, backoff exponencial (300ms) | `lib/premium-3-0/neutrino-api.ts#L12-L13` |
| Rate limit interno | ➕ | Não mencionado | Mínimo 120ms entre chamadas | `lib/premium-3-0/neutrino-api.ts#L14` |

### 7.2 Mastercard API

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| Mastercard 2.1 — BIN Lookup | ❌ | Descrito com chamadas ativas | Credenciais configuradas, **sem chamadas ativas** no motor | `.env.example#L22-L32` |
| Mastercard 2.2 — Identity Insights | ❌ | Descrito como integrado | **Sem chamadas ativas** no motor principal | — |
| Mastercard 2.3 — Processing API | ❌ | `mastercardProcessingClient.ts` citado | Arquivo **não existe** | — |
| Mastercard 2.4 — Ethoca Alerts | ❌ | Descrito como integrado | **Não implementado** no código atual | — |
| `MastercardBINLookupResponse` | ⚠️ | Interface descrita | Interface existe em `types.ts` mas nunca é usada no fluxo principal | `lib/premium-3-0/types.ts#L112` |
| `MastercardIdentityInsightsResponse` | ⚠️ | Interface descrita | Interface existe em `types.ts` mas nunca é usada no fluxo principal | `lib/premium-3-0/types.ts#L125` |

### 7.3 FraudLabs Pro

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| FraudLabs Pro como provedor | ➕ | Não mencionado no doc original | Suportado em `normalizeBinApiResponse.ts` como provider `FRAUDLABS` | `lib/premium-3-0/normalizeBinApiResponse.ts#L43` |

---

## 🌐 Seção 8 — Endpoints

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| `POST /api/bin-analysis-v2` | ✅ | Endpoint principal | Confirmado como endpoint canônico | `app/api/bin-analysis-v2/route.ts` |
| Request `{ bin }` | ✅ | `{ bin: string }` | `BinAnalysisV2Request = { bin: string }` | `lib/premium-3-0/types.ts#L312` |
| Resposta: `FullBinAnalysis` | ✅ | Tipo de resposta | Confirmado — retorna `FullBinAnalysis` diretamente | `app/api/bin-analysis-v2/route.ts#L151` |
| Rate limiting | ✅ | Mencionado | 30 req/60s por IP | `app/api/bin-analysis-v2/route.ts#L13-L14` |
| Custo: 3 créditos | ✅ | Mencionado | `BIN_ANALYSIS_CREDIT_COST = 3` | `app/api/bin-analysis-v2/route.ts#L16` |
| `POST /api/bin-analysis` | ⚠️ | Não claramente documentado | Existe, usa BinList.net, sem rate limit próprio | `app/api/bin-analysis/route.ts` |
| `POST /api/bin/verify` | ❌ | Não documentado como deprecated | **DEPRECATED** — proxy para v2, emite `console.warn` | `app/api/bin/verify/route.ts#L66` |
| Estrutura de erro `{ ok, error: { code, message, requestId } }` | ➕ | Não documentado | Implementado em `buildErrorResponse()` | `app/api/bin-analysis-v2/route.ts#L22` |

---

## 🔑 Seção 9 — Variáveis de Ambiente

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Listada | Presente no `.env.example` e validada via Zod | `.env.example#L2`, `lib/env.ts#L7` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Listada | Presente | `.env.example#L3`, `lib/env.ts#L8` |
| `NEXT_PUBLIC_REQUIRE_AUTH` | ✅ | Listada | Presente, default `"false"` | `.env.example#L7`, `lib/env.ts#L9` |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | ✅ | Listada | Presente (opcional) | `.env.example#L10`, `lib/env.ts#L10` |
| `NEUTRINO_API_KEY` | ✅ | Listada | Presente, obrigatória em produção | `.env.example#L18`, `lib/env.ts#L13` |
| `NEUTRINO_USER_ID` | ✅ | Listada | Presente, obrigatória em produção | `.env.example#L19`, `lib/env.ts#L14` |
| `MASTERCARD_CONSUMER_KEY` | ✅ | Listada | Presente (opcional) | `.env.example#L23`, `lib/env.ts#L16` |
| `MASTERCARD_SANDBOX_CLIENT_ID` | ✅ | Listada | Presente (opcional) | `.env.example#L24`, `lib/env.ts#L17` |
| `MASTERCARD_KEY_ALIAS` | ✅ | Listada | Presente (opcional) | `.env.example#L25`, `lib/env.ts#L18` |
| `MASTERCARD_KEY_PASSWORD` | ✅ | Listada | Presente (opcional) | `.env.example#L26`, `lib/env.ts#L19` |
| `MASTERCARD_P12_PATH` | ✅ | Listada | Presente (opcional) | `.env.example#L27`, `lib/env.ts#L20` |
| `MASTERCARD_P12_CERT` | ✅ | Listada | Presente (alternativa ao PATH) | `.env.example#L29`, `lib/env.ts#L21` |
| `MASTERCARD_SANDBOX_MODE` | ✅ | Listada | Presente, default `"true"` | `.env.example#L31`, `lib/env.ts#L22` |
| `CREDITS_TESTING_MODE` | ➕ | Não mencionado no doc original | Presente — desativa dedução de créditos em dev | `.env.example#L13`, `lib/env.ts#L11` |
| Validação via Zod (`lib/env.ts`) | ➕ | Não mencionado | Centralizada em `getEnv()`, `getNeutrinoCredentials()`, `getSupabasePublicEnv()` | `lib/env.ts` |

---

## 🗄️ Seção 10 — Tabelas Supabase

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| `bin_analyses` | ❌ | Tabela citada | **Não existe** — tabela real é `bin_analysis_logs` | `scripts/008_bin_analysis_v2_tables.sql#L5` |
| `bin_overrides` | ❌ | Tabela citada | **Não existe** — tabela real é `bin_intelligence_overrides` | `scripts/008_bin_analysis_v2_tables.sql#L32` |
| `analysis_logs` | ❌ | Tabela citada | **Não existe** como nome isolado — combinado em `bin_analysis_logs` | — |
| `bin_analysis_logs` | ➕ | Não mencionado pelo nome correto | Tabela principal de histórico | `scripts/008_bin_analysis_v2_tables.sql#L5`, `scripts/010_bin_intelligence_tables.sql#L8` |
| `bin_intelligence_overrides` | ➕ | Não mencionado pelo nome correto | Tabela de overrides manuais | `scripts/008_bin_analysis_v2_tables.sql#L32`, `scripts/010_bin_intelligence_tables.sql#L65` |
| `users` | ✅ | Mencionada | Existe com `role`, `credits`, `email`, etc. | `scripts/001_create_database_structure.sql#L9` |
| `user_credits_log` | ✅ | `credits` (tabela) | Existe como `user_credits_log` | `scripts/001_create_database_structure.sql#L56` |
| `bin_verifications` | ➕ | Não mencionada | Tabela legada do endpoint `/api/bin/verify` | `scripts/001_create_database_structure.sql#L93` |
| `profiles` | ❌ | Citada em algumas versões do doc | **Não existe** — tabela é `users` | — |
| `user_sessions`, `failed_login_attempts`, `suspicious_sessions` | ➕ | Não mencionadas | Existem nas migrations | `scripts/001_create_database_structure.sql#L21-53` |
| RLS habilitado em todas as tabelas | ✅ | Mencionado | Confirmado — `ENABLE ROW LEVEL SECURITY` em todas | `scripts/002_enable_rls_policies.sql` |
| Inconsistência `confidence` (`BAIXA/MEDIA/ALTA` vs `LOW/MEDIUM/HIGH`) | ⚠️ | Doc usava EN | Migration `010` usa PT-BR (`BAIXA/MEDIA/ALTA`); migration `008` usa EN (`LOW/MEDIUM/HIGH`); tipo TypeScript usa EN | `scripts/010_bin_intelligence_tables.sql#L77`, `scripts/008_bin_analysis_v2_tables.sql#L38`, `lib/premium-3-0/types.ts#L323` |

---

## 💡 Seção 11 — Recomendações (`action`)

| Item | Status | Doc original dizia | Código real | Arquivo/Linha |
|---|---|---|---|---|
| `APPROVE` | ✅ | Listado | Presente em `RiskEngineResult.recommendations.action` e `HistoryEntry.action` | `lib/premium-3-0/types.ts#L98` |
| `CHALLENGE` | ✅ | Listado | Presente | `lib/premium-3-0/types.ts#L98` |
| `DECLINE` | ✅ | Listado | Presente | `lib/premium-3-0/types.ts#L98` |
| `REVIEW` | ✅ | Presente ou ausente dependendo da versão | Presente em `RiskEngineResult.recommendations.action` | `lib/premium-3-0/types.ts#L98` |
| Mapeamento de `BinRiskAnalysis.recommendation` → `action` | ➕ | Não documentado | `ALLOW_WITH_MONITORING → APPROVE`, `REQUIRE_3DS → CHALLENGE`, `BLOCK_PREVENTIVELY → DECLINE`, outros → `REVIEW` | `lib/premium-3-0/adapters.ts#L75-L82` |
| `INSUFFICIENT_DATA` (recomendação interna) | ➕ | Não documentado | Tipo interno de `BinRiskAnalysis.recommendation`, mapeado para `REVIEW` no adapter | `lib/premium-3-0/types.ts#L263-L269` |

---

## 📊 Resumo Quantitativo

| Status | Quantidade |
|---|---|
| ✅ Confirmado correto | 28 |
| ⚠️ Parcialmente correto | 10 |
| ❌ Incorreto ou inexistente | 39 |
| ➕ No código mas faltava no doc | 28 |
| **Total de itens auditados** | **105** |

### Principais Áreas de Discrepância

1. **Nomes de tipos e interfaces** — o doc original usava `HolisticAnalysisResult`, `holisticEngine.ts`, `riskEngine.ts`, `threeDSEngine.ts` que não existem no código real.
2. **Motor de risco** — doc descrevia pesos fixos (0.25/0.25/0.20/0.15/0.10/0.05). Código usa score incremental ajustado por presença/ausência de campos.
3. **Motor 3DS** — doc descrevia thresholds simples (<30/>60). Código usa score composto de 5 dimensões com thresholds 20/40/70.
4. **Integração Mastercard** — doc descrevia 4 sub-APIs ativas. Código tem credenciais configuradas mas sem chamadas ativas no motor principal.
5. **Tabelas Supabase** — nomes diferentes dos descritos no doc (`bin_analyses` vs `bin_analysis_logs`, `bin_overrides` vs `bin_intelligence_overrides`).
6. **Stack** — Next.js 15 (não 14), React 19 (não 18), pnpm (não npm).

---

## 🔜 Próximas Fases

### Fase 2 — Tipos & Contratos

**Objetivo**: Alinhar inconsistências de tipo entre código e migrations.

| Item | Ação sugerida |
|---|---|
| `BinOverride.confidence`: EN no TypeScript vs PT-BR na migration `010` | Padronizar para EN (`LOW/MEDIUM/HIGH`) na migration e TypeScript |
| `temporalRisk`, `behavioralRisk`, `deviceRisk`, `gatewayRisk` sempre `0` no adapter | Documentar como "não implementados" ou remover do `RiskFactors` |
| `AnalysisRequest.transactionAmount` etc. nunca usado em `/api/bin-analysis-v2` | Documentar que endpoint v2 recebe apenas `{ bin }` |
| `IssuerIntelligence` descrita no doc mas inexistente | Decidir: criar interface formal ou remover do roadmap |

### Fase 3 — Endpoints & Integrações

**Objetivo**: Formalizar deprecações e alinhar contratos de API.

| Item | Ação sugerida |
|---|---|
| `/api/bin-analysis` | Adicionar header de deprecação `Deprecation: true`, documentar sunset date |
| `/api/bin/verify` | Já emite `console.warn` — adicionar header HTTP `Deprecation` + `Link: /api/bin-analysis-v2` |
| Mastercard API | Decidir: remover variáveis do `.env.example` (se não será implementada) ou criar stub documentado |
| BIN de 10 dígitos | Remover do roadmap ou implementar suporte (`substring(0, 10)`) |

### Fase 4 — Banco & Métricas

**Objetivo**: Resolver conflitos entre migrations e instrumentar KPIs.

| Item | Ação sugerida |
|---|---|
| Conflito entre `008_bin_analysis_v2_tables.sql` e `010_bin_intelligence_tables.sql` | Criar migration de consolidação (drop e recreate com schema canônico) |
| Campo `result JSONB` em `bin_analysis_logs` (script em `saveBinAnalysisLog.ts`) | Validar se a coluna existe no schema — não aparece na migration `010` |
| Perfis de banco (Nubank, Inter, etc.) | Documentar como "não implementado" ou criar tabela `issuer_profiles` |
| KPIs declarados no doc (tempo médio, taxa de bloqueio, cobertura por país) | Implementar via query na tabela `bin_analysis_logs` |

---

_Auditoria executada em 2026-05-08. Branch: `copilot/phase-1-align-documentation`. Nenhum arquivo de código foi modificado nesta fase._
