# VeriFiBIN 2.0

Plataforma web para análise de BIN, score antifraude e apoio operacional com integração a Supabase e provedores externos.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + componentes UI (Radix/shadcn)
- Supabase (Auth + PostgreSQL)
- Motor canônico de análise em `lib/premium-3-0/`

## Arquitetura (resumo)

- `app/`: páginas e route handlers (`/api/bin-analysis` e `/api/bin-analysis-v2`)
- `components/`: UI e telas de dashboard/análise
- `lib/premium-3-0/`: motor principal e integrações externas (Neutrino e Mastercard)
- `lib/supabase/`: clientes SSR/browser e middleware de sessão
- `scripts/`: SQL e utilitários de banco

## Variáveis de ambiente

Use `.env.example` como referência oficial.

Principais variáveis:

- Cliente + servidor (públicas): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_REQUIRE_AUTH`, `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`
- Somente servidor (secretas): `NEUTRINO_API_KEY`, `NEUTRINO_USER_ID`, `MASTERCARD_*`

> Nunca exponha segredos em variáveis `NEXT_PUBLIC_*`.

## Rodando localmente

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

App local: `http://localhost:3000`

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```
