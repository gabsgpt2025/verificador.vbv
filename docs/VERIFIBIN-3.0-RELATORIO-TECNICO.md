# VeriFiBIN 3.0 Premium — Relatório Técnico Completo

> **Versão**: 3.0.1 · **Data**: 2026-05-08 · **Status**: Produção
>
> _Documento sincronizado com código real (auditoria fase 1)_

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Motor Holístico de Análise (Motor Principal)](#3-motor-holístico-de-análise-motor-principal)
4. [Motores Especializados](#4-motores-especializados)
5. [APIs e Integrações Externas](#5-apis-e-integrações-externas)
6. [Fluxo de Processamento](#6-fluxo-de-processamento)
7. [Configuração de Ambiente](#7-configuração-de-ambiente)
8. [Referência de Tipos TypeScript](#8-referência-de-tipos-typescript)
9. [Banco de Dados (Supabase)](#9-banco-de-dados-supabase)
10. [Segurança e Controle de Acesso](#10-segurança-e-controle-de-acesso)
11. [Conclusão e Próximas Fases](#11-conclusão-e-próximas-fases)

---

## 1. Visão Geral

O **VeriFiBIN** é uma plataforma web de análise de BIN (_Bank Identification Number_), score antifraude e apoio operacional. Integra provedores externos (Neutrino API, Mastercard), banco de dados Supabase e um motor de análise em TypeScript puro.

### Stack Tecnológico (real, extraído de `package.json`)

| Tecnologia | Versão |
|---|---|
| **Next.js** | `15.5.15` (App Router) |
| **React** | `19.2.0` |
| **React DOM** | `19.2.0` |
| **TypeScript** | `^5` |
| **Tailwind CSS** | `^4.1.9` |
| **@supabase/supabase-js** | `^2.105.3` |
| **@supabase/ssr** | `0.10.2` |
| **Zod** | `3.25.76` |
| **Vitest** | `^4.1.5` |
| **Gerenciador de pacotes** | `pnpm@9.15.0` |

> 📝 **Atualizado vs. v3.0.0 inicial**: A versão original do documento citava "Next.js 14". O projeto usa Next.js 15.5.15 e React 19.

---

## 2. Arquitetura

### 2.1 Estrutura de Diretórios (real)

```
app/
  api/
    bin-analysis-v2/route.ts   ← endpoint principal (Neutrino → lib/premium-3-0/)
    bin-analysis/route.ts      ← endpoint compatível (BinList.net → lib/premium-3-0/)
    bin/verify/route.ts        ← DEPRECATED — proxy para v2, com log de aviso
    credits/
      balance/route.ts
      history/route.ts
      operations/route.ts
    history/route.ts
  auth/
    login/page.tsx
    register/page.tsx
    verify-email/page.tsx
  dashboard/
    bin-pro/page.tsx           ← página principal (Premium3DAnalyzer)
    ml-scoring/page.tsx        ← admin only
    currency/page.tsx
    credits/page.tsx
  premium-3-0/page.tsx
  profile/page.tsx
  settings/page.tsx
  admin/
    dashboard/page.tsx
    page.tsx

components/
  premium-3-0/
    Premium3DAnalyzer.tsx      ← componente principal de análise
  bin-pro/
    ml-scoring-dashboard.tsx
    currency-converter-widget.tsx
    bin-pro-history.tsx
  cyberpunk/                   ← tipografia e navegação com tema neon
  dashboard/
    bin-verification-widget.tsx
    dashboard-header.tsx
  auth/
    logout-button.tsx
  ui/                          ← shadcn/ui primitives (Radix)

lib/
  premium-3-0/                 ← motor canônico de análise BIN
    index.ts                   ← runFullBinAnalysis() — orquestrador
    types.ts                   ← tipos: FullBinAnalysis, BinApiData, etc.
    neutrino-api.ts            ← callNeutrinoApi() — integração Neutrino
    adapters.ts                ← mapFullBinAnalysisToResponse()
    analyzeThreeDS.ts          ← motor de inferência 3DS
    calculateRisk.ts           ← motor de risco (score incremental)
    calculateDataQuality.ts    ← avaliação de qualidade de dados
    analyzeCompliance.ts       ← análise de compliance regulatório
    generateRecommendation.ts  ← recomendação final em texto
    normalizeBinApiResponse.ts ← normalização multi-provedor
    applyBinOverrides.ts       ← aplica correções manuais da tabela
    saveBinAnalysisLog.ts      ← persiste log no Supabase
    country3dsMaturity.ts      ← tabela de maturidade 3DS por país
    mlModels.ts
    presentation.ts
    glossary.ts
    currencyConverter.ts
    useAnalysisMode.ts
  supabase/
    client.ts                  ← cliente browser
    server.ts                  ← cliente SSR
    middleware.ts
  credits/
    operations.ts              ← subtractCredits() via RPC atômico
  env.ts                       ← validação Zod de todas as env vars
  auth.ts
  open-access-mode.ts
  utils.ts

scripts/                       ← migrations SQL idempotentes
  001_create_database_structure.sql
  002_enable_rls_policies.sql
  003_create_triggers_functions.sql
  004_insert_initial_data.sql
  005_update_tools_data.sql
  006_sync_test_users.sql
  007_fix_test_users_credits.sql
  008_bin_analysis_v2_tables.sql
  009_group_c_database_alignment.sql
  010_bin_intelligence_tables.sql
  010_group_a_api_alignment.sql
  create-test-users.sql

docs/
  VERIFIBIN-3.0-RELATORIO-TECNICO.md  ← este arquivo
  CONFORMIDADE-AUDITORIA.md
  AUDIT_v1.md
  DISCOVERY_AUDIT.md
```

> **Nota**: `lib/bin/` foi **removido** em PRs anteriores. O único motor canônico é `lib/premium-3-0/`. `src/lib/intelligence/` não existe mais neste repositório.

### 2.2 Camadas da Arquitetura

```
┌─────────────────────────────────────────┐
│  UI / Frontend                          │
│  components/premium-3-0/               │
│  Premium3DAnalyzer.tsx                  │
└────────────────┬────────────────────────┘
                 │ POST /api/bin-analysis-v2
┌────────────────▼────────────────────────┐
│  API Route Handler                      │
│  app/api/bin-analysis-v2/route.ts       │
│  (auth, rate limit, créditos)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Motor Canônico (lib/premium-3-0/)      │
│  callNeutrinoApi()  ← Neutrino API      │
│  normalizeBinApiResponse()              │
│  applyBinOverrides()  ← Supabase        │
│  runFullBinAnalysis()                   │
│    ├── analyzeThreeDS()                 │
│    ├── calculateRisk()                  │
│    ├── calculateDataQuality()           │
│    ├── analyzeCompliance()              │
│    └── generateRecommendation()         │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Persistência (Supabase PostgreSQL)     │
│  saveBinAnalysisLog()                   │
│  subtractCredits()                      │
└─────────────────────────────────────────┘
```

---

## 3. Motor Holístico de Análise (Motor Principal)

O orquestrador principal é `runFullBinAnalysis()`, exportado por [`lib/premium-3-0/index.ts`](../lib/premium-3-0/index.ts).

### 3.1 Função Orquestradora

```typescript
// lib/premium-3-0/index.ts
export function runFullBinAnalysis(binData: BinApiData): FullBinAnalysis {
  const threeDSAnalysis  = analyzeThreeDS(binData)
  const riskAnalysis     = calculateRisk(binData, threeDSAnalysis)
  const dataQuality      = calculateDataQuality(binData)
  const compliance       = analyzeCompliance(binData)

  const partialAnalysis = {
    bin: binData.bin,
    source: { provider: binData.source, rawDataAvailable: binData.raw !== undefined, ... },
    technicalData: binData,
    threeDSAnalysis,
    riskAnalysis,
    dataQuality,
    compliance,
  }

  const finalSummary = generateRecommendation(partialAnalysis)
  return { ...partialAnalysis, finalSummary }
}
```

### 3.2 Tipo de Saída: `FullBinAnalysis`

O tipo real de retorno do motor (definido em [`lib/premium-3-0/types.ts`](../lib/premium-3-0/types.ts)):

```typescript
// lib/premium-3-0/types.ts — linhas 293–310
export type FullBinAnalysis = {
  bin: string
  source: {
    provider: string
    rawDataAvailable: boolean
    apiConfidence: "LOW" | "MEDIUM" | "HIGH"
  }
  technicalData: BinApiData
  threeDSAnalysis: BinThreeDSResult
  riskAnalysis: BinRiskAnalysis
  dataQuality: BinDataQualityAnalysis
  compliance: BinComplianceAnalysis
  finalSummary: {
    title: string
    message: string
    action: string
  }
}
```

> 📝 **Atualizado vs. v3.0.0 inicial**: O documento original descrevia um tipo `HolisticAnalysisResult` com campos `threatScore`, `ensemble`, `bypassProbability` etc. Esses campos **não existem** no código real. O tipo real é `FullBinAnalysis` com a estrutura acima.

### 3.3 Adaptador para `AnalysisResponse`

O componente `Premium3DAnalyzer.tsx` recebe um `AnalysisResponse` (compatível com a API legada). A conversão de `FullBinAnalysis → AnalysisResponse` é feita por `mapFullBinAnalysisToResponse()` em [`lib/premium-3-0/adapters.ts`](../lib/premium-3-0/adapters.ts).

```typescript
// lib/premium-3-0/adapters.ts
export function mapFullBinAnalysisToResponse(apiData: FullBinAnalysis): AnalysisResponse {
  // ... mapeamento completo de campos
  return {
    requestId: `req_${Date.now()}`,
    timestamp: now,
    binAnalysis: { ... },
    threeDSAnalysis: { ... },
    riskAnalysis: {
      ...
      recommendations: {
        action: recommendationAction,  // APPROVE | CHALLENGE | DECLINE | REVIEW
        ...
      }
    },
    languageMode: { mode: "TECHNICAL", ... }
  }
}
```

---

## 4. Motores Especializados

### 4.1 Motor 3DS (`analyzeThreeDS`)

**Arquivo**: [`lib/premium-3-0/analyzeThreeDS.ts`](../lib/premium-3-0/analyzeThreeDS.ts)

#### Função de score (soma de sub-scores por dimensão)

| Dimensão | Condição | Impacto no score |
|---|---|---|
| **Bandeira** | VISA / MASTERCARD / AMEX | +20 |
| **Bandeira** | Outras | +5 |
| **Bandeira** | Ausente | 0 |
| **Tipo** | CREDIT | +20 |
| **Tipo** | DEBIT | +5 |
| **Tipo** | PREPAID | −25 |
| **Tipo** | Ausente | 0 |
| **Categoria** | GOLD/PLATINUM/BLACK/INFINITE/SIGNATURE/WORLD | +15 |
| **Categoria** | BUSINESS/CORPORATE | +10 |
| **Categoria** | CLASSIC/STANDARD | 0 |
| **Categoria** | Outras/Ausente | −5 |
| **País** | Maturidade HIGH (`country3dsMaturity.ts`) | +25 |
| **País** | Maturidade MEDIUM | +10 |
| **País** | Maturidade LOW | −15 |
| **País** | Não encontrado na tabela | −10 |
| **País** | Ausente | −20 |
| **Emissor** | Presente e não vazio | +10 |
| **Emissor** | Ausente/vazio | −10 |

#### Mapeamento de score para status 3DS

| Score | Status | Confiança | `challengeLikelihood` |
|---|---|---|---|
| ≥ 70 | `LIKELY_ACTIVE` | `HIGH` | `HIGH` |
| ≥ 40 | `LIKELY_ACTIVE` | `MEDIUM` | `MEDIUM` |
| ≥ 20 | `UNKNOWN` | `LOW` | `UNKNOWN` |
| < 20 | `LIKELY_INACTIVE` | `LOW` | `LOW` |

> 📝 **Atualizado vs. v3.0.0 inicial**: O documento original descrevia thresholds `<30 FRICTIONLESS / 30-60 HYBRID / >60 CHALLENGE`. O motor real usa os thresholds acima (soma de sub-scores por dimensão, não score único de risco).

#### Inferência de protocolo 3DS

```typescript
// lib/premium-3-0/analyzeThreeDS.ts
function inferProtocol(score, brand, countryCode): BinThreeDSResult["protocolLikely"] {
  const isMainBrand = ["VISA", "MASTERCARD", "AMEX"].includes(brand)
  const isHighRegulatory = entry?.mandate === "PSD2_SCA" || "SCA_STRONG" || ...
  if (score >= 45 && isMainBrand) {
    if (isHighRegulatory) return "EMV_3DS_2_2"
    return "EMV_3DS_2"
  }
  return "UNKNOWN"
}
```

#### Tipo de saída: `BinThreeDSResult`

```typescript
// lib/premium-3-0/types.ts — linhas 234–252
export type BinThreeDSResult = {
  status:
    | "CONFIRMED_ACTIVE"
    | "CONFIRMED_INACTIVE"
    | "LIKELY_ACTIVE"
    | "LIKELY_INACTIVE"
    | "UNKNOWN"
  confidence: "LOW" | "MEDIUM" | "HIGH"
  challengeLikelihood: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN"
  protocolLikely:
    | "EMV_3DS_1" | "EMV_3DS_2" | "EMV_3DS_2_1" | "EMV_3DS_2_2" | "UNKNOWN"
  authMethodsLikely: string[]
  explanation: string
  inferred: boolean
}
```

### 4.2 Motor de Risco (`calculateRisk`)

**Arquivo**: [`lib/premium-3-0/calculateRisk.ts`](../lib/premium-3-0/calculateRisk.ts)

O motor de risco usa um **score incremental** (base = 30, clampado entre 0–100) ajustado por fatores presentes nos dados:

| Fator | Condição | Ajuste |
|---|---|---|
| Base inicial | — | +30 |
| Emissor ausente | `!binData.issuer` | +15 |
| País ausente | `!binData.countryCode` | +15 |
| País maturidade HIGH | Tabela `country3dsMaturity.ts` | −10 |
| País maturidade LOW | Tabela `country3dsMaturity.ts` | +15 |
| Cartão pré-pago | `isPrepaid === true` | +20 |
| Tipo desconhecido | `!binData.type` | +10 |
| Categoria desconhecida | `!binData.category` | +10 |
| 3DS provavelmente inativo | `status === "LIKELY_INACTIVE"` | +25 |
| Status 3DS desconhecido | `status === "UNKNOWN"` | +10 |
| 3DS provavelmente ativo | `status === "LIKELY_ACTIVE"` ou `"CONFIRMED_ACTIVE"` | −10 |
| Dados completos + emissor | Todos os campos chave presentes | −10 |
| Cartão comercial/PJ | `isCommercial === true` | +5 |
| BIN de 8 dígitos | `binLength >= 8` | −5 |

#### Mapeamento de score para nível de risco

| Score | `level` |
|---|---|
| ≥ 81 | `CRITICAL` |
| ≥ 61 | `HIGH` |
| ≥ 31 | `MEDIUM` |
| < 31 | `LOW` |

#### Mapeamento de score para recomendação interna

| Score | `recommendation` (interna) |
|---|---|
| Sem dados mínimos | `INSUFFICIENT_DATA` |
| ≥ 81 | `BLOCK_PREVENTIVELY` |
| ≥ 61 | `REQUIRE_3DS` |
| ≥ 31 | `REVIEW` |
| < 31 | `ALLOW_WITH_MONITORING` |

> 📝 **Atualizado vs. v3.0.0 inicial**: O documento original descrevia pesos fixos por dimensão (0.25/0.25/0.20/0.15/0.10/0.05 para 6 dimensões nomeadas). O motor real usa **score incremental** com ajustes por presença/ausência de campos, sem pesos multiplicativos.

#### Tipo de saída: `BinRiskAnalysis`

```typescript
// lib/premium-3-0/types.ts — linhas 260–270
export type BinRiskAnalysis = {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  recommendation:
    | "ALLOW_WITH_MONITORING"
    | "REVIEW"
    | "REQUIRE_3DS"
    | "BLOCK_PREVENTIVELY"
    | "INSUFFICIENT_DATA"
  factors: BinRiskFactor[]
}
```

### 4.3 Motor de Qualidade de Dados (`calculateDataQuality`)

**Arquivo**: [`lib/premium-3-0/calculateDataQuality.ts`](../lib/premium-3-0/calculateDataQuality.ts)

Avalia 5 campos chave: `brand`, `type`, `category`, `countryCode`, `issuer`.

- **Score** = `(campos presentes / 5) × 100`
- **Nível**: `HIGH` (≥80), `MEDIUM` (≥40), `LOW` (<40)

```typescript
// lib/premium-3-0/types.ts — linhas 272–279
export type BinDataQualityAnalysis = {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH"
  missingFields: string[]
  realApiFields: string[]
  inferredFields: string[]
}
```

### 4.4 Motor de Compliance (`analyzeCompliance`)

**Arquivo**: [`lib/premium-3-0/analyzeCompliance.ts`](../lib/premium-3-0/analyzeCompliance.ts)

Classifica o país do emissor por mandato regulatório:

| Região | Mandato (`threeDSMandateLevel`) | `complianceRisk` |
|---|---|---|
| UE (PSD2) / UK (SCA) | `MANDATORY` | `LOW` |
| Índia (RBI) | `MANDATORY` | `LOW` |
| Brasil (BACEN) | `STRONG` | `LOW` |
| Canadá / Austrália | `STRONG` | `LOW` |
| EUA | `OPTIONAL` | `MEDIUM` |
| América Latina | `MODERATE` | `MEDIUM` |
| Maturidade LOW (outros) | `LOW` | `HIGH` |
| País não identificado | `UNKNOWN` | `UNKNOWN` |

```typescript
// lib/premium-3-0/types.ts — linhas 280–291
export type BinComplianceAnalysis = {
  regulatoryRegion: string
  threeDSMandateLevel:
    | "MANDATORY" | "STRONG" | "MODERATE"
    | "OPTIONAL" | "LOW" | "UNKNOWN"
  regulationNote: string
  complianceRisk: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN"
}
```

### 4.5 Geração de Recomendação Final (`generateRecommendation`)

**Arquivo**: [`lib/premium-3-0/generateRecommendation.ts`](../lib/premium-3-0/generateRecommendation.ts)

Gera um `finalSummary` em texto natural com base no nível de risco e recomendação interna:

| `riskAnalysis.level` / `recommendation` | `finalSummary.title` |
|---|---|
| `INSUFFICIENT_DATA` | "Dados insuficientes para análise" |
| `CRITICAL` / `BLOCK_PREVENTIVELY` | "Risco crítico — bloqueio preventivo recomendado" |
| `HIGH` / `REQUIRE_3DS` | "Risco elevado — autenticação adicional recomendada" |
| `MEDIUM` / `REVIEW` | "Revisão recomendada" |
| `LOW` / `ALLOW_WITH_MONITORING` | "Baixo risco estimado — monitoramento padrão" |

### 4.6 Tabela de Maturidade 3DS por País

**Arquivo**: [`lib/premium-3-0/country3dsMaturity.ts`](../lib/premium-3-0/country3dsMaturity.ts)

Dados armazenados como categorias qualitativas (`HIGH` / `MEDIUM` / `LOW`). **Não há percentuais numéricos** no código. Países cobertos na tabela atual:

| Código | Maturidade | Mandato |
|---|---|---|
| `BR` | HIGH | `BROAD_ADOPTION` |
| `US` | MEDIUM | `OPTIONAL_MARKET_DRIVEN` |
| `GB` | HIGH | `SCA_STRONG` |
| `DE`, `FR`, `ES`, `IT`, `NL`, `BE`, `PT`, `SE` | HIGH | `PSD2_SCA` |
| `IN` | HIGH | `STRONG_AUTH_REQUIRED` |
| `CA`, `AU` | HIGH | `STRONG_ADOPTION` |
| `NO` | HIGH | `SCA_STRONG` |
| `MX`, `AR`, `CL`, `CO`, `PE` | MEDIUM | `VARIABLE` |
| `PY`, `VE`, `NG`, `KE` | LOW | `WEAK` / `VARIABLE` |

> ⚠️ **Nota**: O documento original citava percentuais (BR 95%, GB 98%, US 45%, RU 20%, UA 15%). Esses valores **não existem no código**. A tabela real usa apenas categorias qualitativas. `RU` (Rússia) e `UA` (Ucrânia) não estão presentes na tabela atual.

### 4.7 Normalização Multi-Provedor (`normalizeBinApiResponse`)

**Arquivo**: [`lib/premium-3-0/normalizeBinApiResponse.ts`](../lib/premium-3-0/normalizeBinApiResponse.ts)

Suporta múltiplos provedores de BIN:

| Provider | Origem |
|---|---|
| `NEUTRINO` | Neutrino API (padrão em `/api/bin-analysis-v2`) |
| `BINLIST` | lookup.binlist.net (usado em `/api/bin-analysis`) |
| `FRAUDLABS` | FraudLabs Pro (suportado, não ativo por padrão) |
| `INTERNAL` | Dados manuais/override |
| `UNKNOWN` | Fallback |

> 📝 **Atualizado vs. v3.0.0 inicial**: O documento original mencionava "Mastercard 2.1–2.4" como provedor de BIN lookup. No código real, a fonte primária de dados de BIN é a **Neutrino API**, não Mastercard. As credenciais Mastercard estão no `.env.example` mas nenhuma chamada ativa à Mastercard BIN API foi encontrada no motor principal.

---

## 5. APIs e Integrações Externas

### 5.1 Endpoint Principal: `POST /api/bin-analysis-v2`

**Arquivo**: [`app/api/bin-analysis-v2/route.ts`](../app/api/bin-analysis-v2/route.ts)

**Método HTTP**: `POST`

**Rate limit**: 30 req/60s por IP

**Custo de créditos**: 3 créditos por análise (somente usuários autenticados)

#### Request

```json
{
  "bin": "411111"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `bin` | `string` | Sim | 6–8 dígitos do cartão |

Validação: mínimo 6 dígitos não-espaço; limita a 8 dígitos (`substring(0, 8)`).

#### Response (sucesso — `HTTP 200`)

Retorna diretamente o objeto `FullBinAnalysis`:

```typescript
{
  bin: string,
  source: {
    provider: string,           // "NEUTRINO" | "BINLIST" | etc.
    rawDataAvailable: boolean,
    apiConfidence: "LOW" | "MEDIUM" | "HIGH"
  },
  technicalData: BinApiData,
  threeDSAnalysis: BinThreeDSResult,
  riskAnalysis: BinRiskAnalysis,
  dataQuality: BinDataQualityAnalysis,
  compliance: BinComplianceAnalysis,
  finalSummary: {
    title: string,
    message: string,
    action: string
  }
}
```

#### Response (erro)

```json
{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Muitas requisições. Tente novamente em instantes.",
    "requestId": "uuid"
  }
}
```

| Código HTTP | `error.code` | Descrição |
|---|---|---|
| 400 | `INVALID_BIN` | BIN inválido ou ausente |
| 400 | `INSUFFICIENT_CREDITS` | Créditos insuficientes |
| 401 | `UNAUTHORIZED` | Não autenticado (modo auth ativo) |
| 429 | `RATE_LIMITED` | Limite de requisições excedido |
| 500 | `BIN_ANALYSIS_LOG_INSERT_FAILED` | Falha ao salvar log |
| 500 | `INTERNAL_SERVER_ERROR` | Erro inesperado |
| 502 | `UPSTREAM_NEUTRINO_FAILURE` | Falha na Neutrino API |
| 504 | `UPSTREAM_NEUTRINO_FAILURE` | Timeout na Neutrino API |

---

### 5.2 Endpoint Compatível: `POST /api/bin-analysis`

**Arquivo**: [`app/api/bin-analysis/route.ts`](../app/api/bin-analysis/route.ts)

Funcionalidade equivalente ao v2, mas usa **lookup.binlist.net** como provedor de dados (gratuito, sem chave de API). Não possui rate limiting, não usa estrutura de erro padronizada (`{ ok, error }` — apenas `{ error: string }`).

> ⚠️ **Status**: Operacional mas sem manutenção ativa. A Fase 3 formalizará sua deprecação.

---

### 5.3 Endpoint Legado Deprecated: `POST /api/bin/verify`

**Arquivo**: [`app/api/bin/verify/route.ts`](../app/api/bin/verify/route.ts)

**Status**: 🔴 **DEPRECATED** — Registra `console.warn` a cada chamada e faz proxy para `/api/bin-analysis-v2`.

```typescript
// app/api/bin/verify/route.ts:66
console.warn("[DEPRECATED] /api/bin/verify sendo chamado. Migrar para /api/bin-analysis-v2.")
```

Aceita `{ binNumber, verificationType }` e retorna `{ success, result, creditsUsed, newBalance, verificationId }`.

---

### 5.4 Integração Neutrino API

**Arquivo**: [`lib/premium-3-0/neutrino-api.ts`](../lib/premium-3-0/neutrino-api.ts)

- **Endpoint**: `POST https://neutrinoapi.net/bin-lookup`
- **Autenticação**: Headers `User-ID` + `API-Key`
- **Timeout**: 8.000ms por tentativa
- **Retries**: Até 3 tentativas com backoff exponencial (300ms base)
- **Rate limit interno**: Mínimo 120ms entre chamadas consecutivas
- **Parâmetro**: `bin-number` (form-encoded)

---

### 5.5 Integração Mastercard

As credenciais Mastercard estão configuradas no `.env.example` (`MASTERCARD_CONSUMER_KEY`, `MASTERCARD_SANDBOX_CLIENT_ID`, `MASTERCARD_KEY_ALIAS`, `MASTERCARD_KEY_PASSWORD`, `MASTERCARD_P12_PATH` / `MASTERCARD_P12_CERT`, `MASTERCARD_SANDBOX_MODE`).

> ⚠️ **Nota**: No código do motor canônico (`lib/premium-3-0/`), não há chamadas ativas à Mastercard API durante o fluxo de análise. As credenciais estão preparadas na infraestrutura mas não são consumidas na versão atual.

---

## 6. Fluxo de Processamento

```
1. Usuário insere BIN no Premium3DAnalyzer
   └── components/premium-3-0/Premium3DAnalyzer.tsx

2. UI envia POST /api/bin-analysis-v2 com { bin }
   └── app/api/bin-analysis-v2/route.ts

3. Route handler valida BIN e autentica usuário

4. Route handler chama Neutrino API
   └── lib/premium-3-0/neutrino-api.ts → callNeutrinoApi()
   └── lib/premium-3-0/normalizeBinApiResponse.ts → normalizeNeutrinoBinResponse()

5. Aplica overrides manuais (para usuários autenticados)
   └── lib/premium-3-0/applyBinOverrides.ts → applyBinOverrides()
   └── Consulta tabela bin_intelligence_overrides no Supabase

6. Motor executa análise completa
   └── lib/premium-3-0/index.ts → runFullBinAnalysis()
      ├── analyzeThreeDS()       → BinThreeDSResult
      ├── calculateRisk()        → BinRiskAnalysis
      ├── calculateDataQuality() → BinDataQualityAnalysis
      ├── analyzeCompliance()    → BinComplianceAnalysis
      └── generateRecommendation() → finalSummary

7. Log salvo no Supabase (somente usuários autenticados)
   └── lib/premium-3-0/saveBinAnalysisLog.ts → saveBinAnalysisLog()
   └── Tabela: bin_analysis_logs

8. Créditos deduzidos atomicamente via RPC (somente usuários autenticados)
   └── lib/credits/operations.ts → subtractCredits() (3 créditos)

9. Resposta FullBinAnalysis retornada ao cliente

10. UI adapta FullBinAnalysis → AnalysisResponse para exibição
    └── lib/premium-3-0/adapters.ts → mapFullBinAnalysisToResponse()
    └── components/premium-3-0/Premium3DAnalyzer.tsx
```

---

## 7. Configuração de Ambiente

**Arquivo de referência**: [`.env.example`](../.env.example) · **Validação Zod**: [`lib/env.ts`](../lib/env.ts)

| Variável | Categoria | Lado | Obrigatória | Descrição |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | cliente+servidor | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | cliente+servidor | Sim | Chave anon do Supabase |
| `NEXT_PUBLIC_REQUIRE_AUTH` | App | cliente+servidor | Não | `"true"` = login obrigatório; padrão: `"false"` (modo aberto) |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | App (dev) | cliente | Não | URL de redirect OAuth em desenvolvimento |
| `CREDITS_TESTING_MODE` | App (dev) | **servidor** | Não | `"true"` para desabilitar dedução de créditos em dev. **Nunca usar em produção** |
| `NEUTRINO_API_KEY` | Neutrino | **servidor** | Sim* | Chave da Neutrino API |
| `NEUTRINO_USER_ID` | Neutrino | **servidor** | Sim* | ID de usuário Neutrino API |
| `MASTERCARD_CONSUMER_KEY` | Mastercard | **servidor** | Não | Credencial Mastercard OAuth |
| `MASTERCARD_SANDBOX_CLIENT_ID` | Mastercard | **servidor** | Não | Client ID Mastercard sandbox |
| `MASTERCARD_KEY_ALIAS` | Mastercard | **servidor** | Não | Alias do certificado .p12 |
| `MASTERCARD_KEY_PASSWORD` | Mastercard | **servidor** | Não | Senha do certificado .p12 |
| `MASTERCARD_P12_PATH` | Mastercard | **servidor** | Não | Caminho do arquivo .p12 |
| `MASTERCARD_P12_CERT` | Mastercard | **servidor** | Não | Certificado .p12 em base64 (alternativa ao PATH) |
| `MASTERCARD_SANDBOX_MODE` | Mastercard | **servidor** | Não | `"true"` = sandbox (padrão); `"false"` = produção |

\* `NEUTRINO_API_KEY` e `NEUTRINO_USER_ID` devem ser definidos **juntos** (validação Zod em `lib/env.ts`). São obrigatórios em `NODE_ENV=production`.

> **Nunca** exponha segredos Neutrino ou Mastercard em variáveis `NEXT_PUBLIC_*`.

### Helpers de Validação (`lib/env.ts`)

| Função | Descrição |
|---|---|
| `getEnv()` | Retorna e cacheia todas as variáveis validadas |
| `getNeutrinoCredentials()` | Retorna `{ apiKey, userId }` — lança erro se ausentes |
| `getSupabasePublicEnv()` | Retorna `{ url, anonKey }` — lança erro se ausentes |
| `isCreditsTestingModeEnabled()` | Retorna `true` apenas em dev com flag ativada |

---

## 8. Referência de Tipos TypeScript

Todos os tipos abaixo estão em [`lib/premium-3-0/types.ts`](../lib/premium-3-0/types.ts).

### `BinApiData` — dados normalizados do provedor externo

```typescript
export type BinApiData = {
  bin: string
  binLength: number
  brand?: string
  type?: string
  category?: string
  countryCode?: string
  countryName?: string
  currency?: string
  issuer?: string | null
  issuerWebsite?: string | null
  issuerPhone?: string | null
  isCommercial?: boolean
  isPrepaid?: boolean
  source: "NEUTRINO" | "FRAUDLABS" | "BINLIST" | "INTERNAL" | "UNKNOWN"
  raw?: unknown
}
```

### `NeutrinoBinResponse` — resposta bruta da Neutrino API

```typescript
export interface NeutrinoBinResponse {
  bin?: string
  valid?: boolean
  card_brand?: string
  card_type?: string
  card_category?: string
  issuer_name?: string
  issuer_website?: string
  issuer_phone?: string
  country_code?: string
  country_name?: string
  country_iso3?: string
  country_continent?: string
  country_population?: number
  currency_code?: string
  currency_name?: string
  is_commercial?: boolean
  is_prepaid?: boolean
  is_3d_secure?: boolean
  risk_level?: string
  [key: string]: unknown
}
```

### `BinThreeDSResult` — resultado do motor 3DS

```typescript
export type BinThreeDSResult = {
  status:
    | "CONFIRMED_ACTIVE" | "CONFIRMED_INACTIVE"
    | "LIKELY_ACTIVE" | "LIKELY_INACTIVE" | "UNKNOWN"
  confidence: "LOW" | "MEDIUM" | "HIGH"
  challengeLikelihood: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN"
  protocolLikely:
    | "EMV_3DS_1" | "EMV_3DS_2" | "EMV_3DS_2_1" | "EMV_3DS_2_2" | "UNKNOWN"
  authMethodsLikely: string[]
  explanation: string
  inferred: boolean
}
```

### `BinRiskFactor` e `BinRiskAnalysis`

```typescript
export type BinRiskFactor = {
  label: string
  impact: number
  reason: string
}

export type BinRiskAnalysis = {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  recommendation:
    | "ALLOW_WITH_MONITORING" | "REVIEW"
    | "REQUIRE_3DS" | "BLOCK_PREVENTIVELY" | "INSUFFICIENT_DATA"
  factors: BinRiskFactor[]
}
```

### `BinDataQualityAnalysis`

```typescript
export type BinDataQualityAnalysis = {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH"
  missingFields: string[]
  realApiFields: string[]
  inferredFields: string[]
}
```

### `BinComplianceAnalysis`

```typescript
export type BinComplianceAnalysis = {
  regulatoryRegion: string
  threeDSMandateLevel:
    | "MANDATORY" | "STRONG" | "MODERATE"
    | "OPTIONAL" | "LOW" | "UNKNOWN"
  regulationNote: string
  complianceRisk: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN"
}
```

### `BinOverride` — override manual de BIN

```typescript
export type BinOverride = {
  id: string
  bin: string
  field: string
  oldValue: string | null
  correctedValue: string
  confidence: "LOW" | "MEDIUM" | "HIGH"
  reason: string
  source: string
  updatedBy: string
  updatedAt: string
}
```

### `AnalysisRequest` / `AnalysisResponse` — tipos da interface legada (`AnalysisResponse`)

```typescript
export interface AnalysisRequest {
  bin: string
  transactionAmount: number
  transactionCurrency: string
  merchantCountry: string
  cardholderCountry: string
  deviceType: string
  isNewCard: boolean
  isFirstTransaction: boolean
  additionalContext?: Record<string, any>
}

export interface AnalysisResponse {
  requestId: string
  timestamp: string
  binAnalysis: BINAnalysisResult
  threeDSAnalysis: ThreeDSAnalysis
  riskAnalysis: RiskEngineResult
  masterCardIntegration?: { ... }
  languageMode: LanguageMode
}
```

### `RiskEngineResult.recommendations.action` — valores reais

O campo `action` em `RiskEngineResult` aceita:

```typescript
action: 'APPROVE' | 'CHALLENGE' | 'DECLINE' | 'REVIEW'
```

O mapeamento de `BinRiskAnalysis.recommendation` → `AnalysisResponse.riskAnalysis.recommendations.action` é feito em `adapters.ts`:

| `BinRiskAnalysis.recommendation` | `action` |
|---|---|
| `ALLOW_WITH_MONITORING` | `APPROVE` |
| `REQUIRE_3DS` | `CHALLENGE` |
| `BLOCK_PREVENTIVELY` | `DECLINE` |
| `REVIEW` / `INSUFFICIENT_DATA` | `REVIEW` |

### `BypassMechanism` — valores reais

```typescript
bypassMechanism: 'NONE' | 'FRICTIONLESS_3DS2' | 'SCA_EXEMPTION' | '3DS_NOMINAL' | 'UNKNOWN'
```

Mapeamento em `adapters.ts`:

| `recommendedFlow` | `frictionlessLikelihood` | `bypassMechanism` |
|---|---|---|
| `CHALLENGE` | qualquer | `3DS_NOMINAL` |
| qualquer | `VERY_HIGH` | `SCA_EXEMPTION` |
| `FRICTIONLESS` | não VERY_HIGH | `FRICTIONLESS_3DS2` |
| `HYBRID` | não VERY_HIGH | `NONE` |
| outros | outros | `UNKNOWN` |

### `BinAnalysisV2Request` — tipo do request da API v2

```typescript
export type BinAnalysisV2Request = {
  bin: string
}
```

---

## 9. Banco de Dados (Supabase)

### 9.1 Tabelas Principais

#### `public.users`

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  credits INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `public.bin_analysis_logs`

Tabela de histórico completo de análises. Criada em `scripts/010_bin_intelligence_tables.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.bin_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin TEXT NOT NULL,
  bin8 TEXT,                                  -- BIN de 8 dígitos, quando disponível
  api_response_hash TEXT,                     -- SHA256 da resposta da API
  issuer TEXT,
  country TEXT,
  country_code TEXT,
  card_type TEXT,
  card_category TEXT,
  is_prepaid BOOLEAN,
  is_commercial BOOLEAN,
  brand TEXT,
  three_ds_status_estimated TEXT,
  three_ds_confidence TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  recommendation TEXT,
  data_quality_score INTEGER,
  source_api TEXT NOT NULL DEFAULT 'unknown',
  model_version TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  manual_review_status TEXT CHECK (
    manual_review_status IN ('pending','reviewed','escalated','closed')
  ),
  analyst_correction JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

> **Nota**: A migration `008_bin_analysis_v2_tables.sql` cria uma versão simplificada da mesma tabela. A versão completa (com `bin8`, `data_quality_score`, `model_version`, `analyst_correction` etc.) está em `010_bin_intelligence_tables.sql`.

#### `public.bin_intelligence_overrides`

```sql
CREATE TABLE IF NOT EXISTS public.bin_intelligence_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  corrected_value TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('BAIXA', 'MEDIA', 'ALTA')),
  reason TEXT NOT NULL,
  source TEXT,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint: um override por BIN+campo (último vence)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bin_overrides_bin_field
  ON public.bin_intelligence_overrides (bin, field);
```

> ⚠️ **Inconsistência detectada (Fase 2)**: A migration usa `'BAIXA', 'MEDIA', 'ALTA'` enquanto o tipo TypeScript `BinOverride` e a migration `008` usam `'LOW', 'MEDIUM', 'HIGH'`. Isso será alinhado na Fase 2.

#### `public.bin_verifications`

Tabela legada do endpoint `/api/bin/verify`:

```sql
CREATE TABLE IF NOT EXISTS public.bin_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bin_number TEXT NOT NULL,
  card_brand TEXT,
  card_type TEXT,
  card_level TEXT,
  issuer_name TEXT,
  issuer_country TEXT,
  issuer_country_code TEXT,
  issuer_website TEXT,
  issuer_phone TEXT,
  verification_result JSONB,
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `public.user_credits_log`

```sql
CREATE TABLE IF NOT EXISTS public.user_credits_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  credits_used INTEGER NOT NULL,
  operation_type TEXT NOT NULL CHECK (
    operation_type IN ('verification','purchase','refund','bonus')
  ),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9.2 Função PL/pgSQL: `get_bin_overrides`

```sql
CREATE OR REPLACE FUNCTION public.get_bin_overrides(p_bin TEXT)
RETURNS TABLE (
  field TEXT,
  corrected_value TEXT,
  confidence TEXT,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT o.field, o.corrected_value, o.confidence, o.reason
    FROM public.bin_intelligence_overrides o
    WHERE o.bin = p_bin
    ORDER BY o.updated_at DESC;
END;
$$;
```

### 9.3 Row Level Security (RLS)

| Tabela | Política |
|---|---|
| `bin_analysis_logs` | Usuários veem apenas seus próprios logs; admins veem todos; service role pode inserir |
| `bin_intelligence_overrides` | Usuários autenticados podem ler; somente admins podem gerenciar |
| `bin_verifications` | Usuário vê apenas suas verificações |
| Todas as tabelas | RLS habilitado via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |

---

## 10. Segurança e Controle de Acesso

### 10.1 Autenticação

- Controlada por `NEXT_PUBLIC_REQUIRE_AUTH`:
  - `"true"` → Login obrigatório; requests sem usuário autenticado recebem `401`
  - Outro valor / ausente → **Modo aberto** (guest access) — análises permitidas sem login, sem dedução de créditos

- **Middleware** (`middleware.ts` / `lib/supabase/middleware.ts`): Gerencia sessão Supabase via cookies SSR, respeitando a flag de auth.

### 10.2 Rate Limiting

- Implementado in-process no handler `POST /api/bin-analysis-v2`
- Janela: 60 segundos
- Limite: 30 requisições por IP
- Chave: `x-forwarded-for` ou `x-real-ip` ou `"anonymous"`

### 10.3 Créditos

- Custo: 3 créditos por análise
- Dedução atômica via RPC Supabase (`lib/credits/operations.ts → subtractCredits()`)
- Somente para usuários autenticados; guests não pagam créditos

### 10.4 Proteção de PAN

```typescript
// lib/premium-3-0/saveBinAnalysisLog.ts
// Nunca armazenar PAN completo — apenas BIN (6-8 dígitos)
const binToStore = analysis.bin.substring(0, 8)
```

### 10.5 Validação de Env Vars

Todas as variáveis de ambiente são validadas via Zod ao inicializar (`lib/env.ts`). Falhas de validação lançam erros descritivos antes de qualquer processamento.

---

## 11. Conclusão e Próximas Fases

### Resumo da Auditoria (Fase 1)

| Área | Status |
|---|---|
| Stack tecnológico | ✅ Documentado com versões reais |
| Motor canônico (`lib/premium-3-0/`) | ✅ Estrutura completa documentada |
| Tipos TypeScript | ✅ Extraídos diretamente do código |
| Endpoint `/api/bin-analysis-v2` | ✅ Request/response real documentado |
| Variáveis de ambiente | ✅ Lista completa do `.env.example` + `lib/env.ts` |
| Tabelas Supabase | ✅ SQL real das migrations documentado |
| Pesos/fórmulas Risk Engine | 📝 Corrigido: score incremental, não pesos fixos |
| Thresholds 3DS Engine | 📝 Corrigido: score composto, não faixas simples |
| Maturidade 3DS por país | 📝 Corrigido: categorias qualitativas, sem percentuais |
| Integração Mastercard | ⚠️ Credenciais presentes, sem chamadas ativas no motor |

### Próximas Fases

- **Fase 2 — Tipos & Contratos**: Alinhar `BinOverride.confidence` (Pt-BR vs EN), consolidar inconsistências entre migration `008` e `010`, verificar campos `result` na tabela `bin_analysis_logs`.
- **Fase 3 — Endpoints & Integrações**: Deprecar formalmente `/api/bin-analysis` e `/api/bin/verify`; documentar plano de migração.
- **Fase 4 — Banco & Métricas**: Resolver conflito entre migrations `008` e `010` para `bin_analysis_logs`; instrumentar KPIs (tempo médio de análise, taxa de bloqueio, cobertura por país).

---

_Documento sincronizado com código real em `lib/premium-3-0/`, `app/api/`, `scripts/`, `.env.example` e `lib/env.ts`. Auditoria Fase 1 — 2026-05-08._
