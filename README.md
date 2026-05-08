# VeriFiBIN 2.0

Plataforma web para análise de BIN, score antifraude e apoio operacional com integração a Supabase e provedores externos (Neutrino API, Mastercard).

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** + shadcn/ui (Radix primitives)
- **Supabase** (Auth + PostgreSQL, RLS habilitado em todas as tabelas)
- **Motor canônico de análise**: `lib/premium-3-0/`
- **Integrações externas**: Neutrino API (BIN lookup), Mastercard Processing API

## Estrutura de pastas (pós-consolidação)

```
app/
  api/
    bin-analysis-v2/route.ts   ← endpoint principal (usa lib/premium-3-0/)
    bin-analysis/route.ts      ← endpoint compatível (usa lib/premium-3-0/)
    bin/verify/route.ts        ← verificação simples (legado)
    credits/                   ← balance, history, operations
  dashboard/
    bin-pro/                   ← página principal (Premium3DAnalyzer)
    ml-scoring/                ← admin only
    currency/                  ← conversor de moedas
components/
  premium-3-0/
    Premium3DAnalyzer.tsx      ← componente principal de análise
  bin-pro/
    ml-scoring-dashboard.tsx   ← dashboard ML (admin)
    currency-converter-widget.tsx
  cyberpunk/                   ← tipografia e navegação com tema neon
  dashboard/                   ← header, sidebar, widgets
  ui/                          ← shadcn/ui primitives
lib/
  premium-3-0/                 ← motor canônico de análise BIN
    index.ts                   ← runFullBinAnalysis() — orquestrador
    types.ts                   ← tipos: FullBinAnalysis, BinApiData, etc.
    neutrino-api.ts            ← cliente Neutrino API
    adapters.ts                ← mapFullBinAnalysisToResponse()
    analyzeThreeDS.ts
    calculateRisk.ts
    calculateDataQuality.ts
    analyzeCompliance.ts
    generateRecommendation.ts
    normalizeBinApiResponse.ts
    applyBinOverrides.ts
    saveBinAnalysisLog.ts
    ...
  supabase/                    ← clientes SSR/browser + middleware
  credits/operations.ts        ← subtractCredits() via RPC atômico
  env.ts                       ← validação Zod das env vars
  auth.ts                      ← helpers de autenticação
scripts/                       ← migrations SQL idempotentes
```

## Fluxo crítico de análise BIN (smoke test)

```
1. Usuário insere BIN no Premium3DAnalyzer
   └── components/premium-3-0/Premium3DAnalyzer.tsx

2. UI envia POST /api/bin-analysis-v2 com { bin }
   └── app/api/bin-analysis-v2/route.ts

3. Route handler chama Neutrino API
   └── lib/premium-3-0/neutrino-api.ts → callNeutrinoApi()
   └── lib/premium-3-0/normalizeBinApiResponse.ts → normalizeBinApiResponse()

4. Motor executa análise completa
   └── lib/premium-3-0/index.ts → runFullBinAnalysis()
      ├── analyzeThreeDS()
      ├── calculateRisk()
      ├── calculateDataQuality()
      ├── analyzeCompliance()
      └── generateRecommendation()

5. Resposta FullBinAnalysis é adaptada para AnalysisResponse
   └── lib/premium-3-0/adapters.ts → mapFullBinAnalysisToResponse()

6. Crédito é debitado atomicamente via RPC Supabase
   └── lib/credits/operations.ts → subtractCredits()

7. Log de análise é salvo (somente usuários autenticados)
   └── lib/premium-3-0/saveBinAnalysisLog.ts → saveBinAnalysisLog()

8. UI renderiza resultado com tema neon
   └── components/premium-3-0/Premium3DAnalyzer.tsx
```

## Variáveis de ambiente

Use `.env.example` como referência oficial.

| Variável | Lado | Obrigatória | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente+servidor | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente+servidor | Sim | Chave anon do Supabase |
| `NEXT_PUBLIC_REQUIRE_AUTH` | cliente+servidor | Não | `"true"` para habilitar login; padrão: modo aberto |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | cliente | Não | URL de redirect OAuth em dev |
| `NEUTRINO_USER_ID` | **servidor** | Sim* | ID de usuário Neutrino API |
| `NEUTRINO_API_KEY` | **servidor** | Sim* | Chave da Neutrino API |
| `MASTERCARD_CONSUMER_KEY` | **servidor** | Não | Credencial Mastercard |
| `MASTERCARD_SANDBOX_CLIENT_ID` | **servidor** | Não | Client ID Mastercard sandbox |
| `MASTERCARD_KEY_ALIAS` | **servidor** | Não | Alias do certificado Mastercard |
| `MASTERCARD_KEY_PASSWORD` | **servidor** | Não | Senha do certificado Mastercard |
| `MASTERCARD_P12_PATH` | **servidor** | Não | Caminho do arquivo .p12 |
| `MASTERCARD_P12_CERT` | **servidor** | Não | Certificado .p12 em base64 |
| `MASTERCARD_SANDBOX_MODE` | **servidor** | Não | `"true"` para sandbox (padrão) |

*`NEUTRINO_USER_ID` e `NEUTRINO_API_KEY` devem ser definidos juntos.

> **Nunca** exponha segredos (Neutrino, Mastercard) em variáveis `NEXT_PUBLIC_*`.

## Rodando localmente

```bash
pnpm install
cp .env.example .env.local
# edite .env.local com suas credenciais reais
pnpm dev
```

App local: `http://localhost:3000`

## Scripts

```bash
pnpm dev        # servidor de desenvolvimento
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
pnpm build      # build de produção
pnpm test       # vitest run
```

## CI

O workflow `.github/workflows/ci.yml` roda `lint → typecheck → build` em todo PR e push para `main`.

## Documentação Técnica

| Documento | Descrição |
|---|---|
| [`docs/VERIFIBIN-3.0-RELATORIO-TECNICO.md`](docs/VERIFIBIN-3.0-RELATORIO-TECNICO.md) | Relatório técnico completo (v3.0.1) — alinhado ao código real |
| [`docs/CONFORMIDADE-AUDITORIA.md`](docs/CONFORMIDADE-AUDITORIA.md) | Auditoria de conformidade: doc original vs. código real (✅/⚠️/❌/➕) |
