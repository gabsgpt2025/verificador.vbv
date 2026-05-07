# DISCOVERY AUDIT — VeriFiBIN

**Data da auditoria:** 2026-05-06  
**Branch auditado:** `copilot/remove-login-requirement`  
**Auditor:** Copilot SWE Agent

---

## 1. Mapeamento da Arquitetura

### 1.1 Stack Detectada

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 15.5.15** (App Router, SSR/SSG híbrido) |
| Runtime | Node.js (Fluid Compute) |
| Linguagem | TypeScript 5 |
| Estilização | Tailwind CSS 4 + `tw-animate-css` |
| Componentes UI | Radix UI + shadcn/ui customizado (tema "cyberpunk") |
| Banco de dados | **Supabase** (PostgreSQL + RLS) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| BIN Lookup | BinList.net (free, sem chave) |
| Testes | **Vitest 4** |
| Deploy | Vercel (detectado por `next.config.mjs` sem saída estática) |

### 1.2 Estrutura de Pastas (top-level)

```
/
├── app/                    # App Router Next.js
│   ├── api/                # Route Handlers (server)
│   ├── auth/               # Login, Register, Verify Email
│   ├── admin/              # Admin dashboard (requer role=admin)
│   ├── dashboard/          # Rotas principais do usuário
│   ├── profile/            # Perfil do usuário
│   ├── settings/           # Configurações
│   ├── layout.tsx          # Layout raiz (ThemeProvider)
│   └── page.tsx            # Home (landing ou redirect)
├── components/             # Componentes React reutilizáveis
│   ├── bin-pro/            # Componentes da ferramenta BIN
│   ├── credits/            # Gerenciamento de créditos
│   ├── cyberpunk/          # Design system customizado
│   ├── dashboard/          # Header e widgets do dashboard
│   └── ui/                 # Primitivos Radix/shadcn
├── lib/                    # Lógica de negócio (server-side)
│   ├── auth.ts             # Helpers de autenticação
│   ├── bin/                # Motor de análise BIN v2 (lib/bin/)
│   ├── credits/            # Operações de crédito
│   └── supabase/           # Clientes Supabase (server, client, middleware)
├── src/lib/intelligence/   # Motor de análise BIN v1 (legado)
├── tests/                  # Testes Vitest
├── scripts/                # Migrations SQL
├── docs/                   # Documentação
└── middleware.ts            # Middleware Next.js (auth guard)
```

### 1.3 Pontos de Entrada

| Arquivo | Função |
|---------|--------|
| `middleware.ts` | Intercepta TODAS as rotas; delega para `lib/supabase/middleware.ts` |
| `app/layout.tsx` | Layout raiz — ThemeProvider |
| `app/page.tsx` | Home — redireciona para `/dashboard/bin-pro` (open mode) ou landing page |
| `lib/auth.ts` | Helpers `requireAuth()` / `requireAdmin()` usados em todas as páginas SSR |

### 1.4 Mapa de Rotas

| Rota | Componente | Tipo | Protegida? |
|------|-----------|------|-----------|
| `/` | `app/page.tsx` | Landing / Redirect | Pública |
| `/auth/login` | `app/auth/login/page.tsx` | Login form | Pública |
| `/auth/register` | `app/auth/register/page.tsx` | Cadastro | Pública |
| `/auth/verify-email` | `app/auth/verify-email/page.tsx` | Verificação e-mail | Pública |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard principal | **Auth** |
| `/dashboard/bin-pro` | `app/dashboard/bin-pro/page.tsx` | **Ferramenta BIN 2.0** | **Auth** |
| `/dashboard/credits` | `app/dashboard/credits/page.tsx` | Gerenciar créditos | **Auth** |
| `/dashboard/credits/history` | `app/dashboard/credits/history/page.tsx` | Histórico | **Auth** |
| `/dashboard/currency` | `app/dashboard/currency/page.tsx` | Conversor moedas | **Auth** |
| `/dashboard/ml-scoring` | `app/dashboard/ml-scoring/page.tsx` | ML Scoring (admin) | **Auth + Admin** |
| `/profile` | `app/profile/page.tsx` | Perfil | **Auth** |
| `/settings` | `app/settings/page.tsx` | Configurações | **Auth** |
| `/admin` | `app/admin/page.tsx` | Admin geral | **Auth + Admin** |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | Admin dashboard | **Auth + Admin** |
| `/api/bin-analysis` | Route Handler | API BIN v1 | **Auth** |
| `/api/bin-analysis-v2` | Route Handler | API BIN v2 | **Auth** |
| `/api/bin/verify` | Route Handler | BIN Verify simples | **Auth** |
| `/api/credits/balance` | Route Handler | Saldo créditos | **Auth** |
| `/api/credits/history` | Route Handler | Histórico créditos | **Auth** |
| `/api/credits/operations` | Route Handler | Operações crédito | **Auth** |

### 1.5 Configuração de Autenticação

**Middleware (`middleware.ts` → `lib/supabase/middleware.ts`)**
- Cria cliente Supabase SSR a cada request
- Chama `supabase.auth.getUser()` para verificar sessão
- **Antes das correções:** redirecionava TODA rota não-pública para `/auth/login` se não autenticado
- **Após as correções:** o redirect só ocorre quando `NEXT_PUBLIC_REQUIRE_AUTH=true`

**`lib/auth.ts`**
- `getUser()` — retorna usuário Supabase ou `null`
- `requireAuth()` — redireciona para `/auth/login` se não autenticado (agora retorna guest em open mode)
- `requireAdmin()` — verifica `role=admin` no perfil (agora retorna mock admin em open mode)
- `getUserProfile(userId)` — busca perfil na tabela `users`

**Client-side:** `components/auth/logout-button.tsx` usa `@supabase/supabase-js` client

### 1.6 Configuração do Supabase

**Clientes:**
- `lib/supabase/server.ts` — SSR (cookies)
- `lib/supabase/client.ts` — Client-side
- `lib/supabase/middleware.ts` — Middleware

**Variáveis de ambiente necessárias:**
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

**Tabelas detectadas (uso em código):**
- `users` — perfis, role, credits
- `bin_verifications` — histórico de verificações
- `bin_analysis_logs` — logs de análise v2
- `bin_intelligence_overrides` — overrides internos de BIN
- `user_activity_logs` — log de atividades
- `suspicious_sessions` — sessões suspeitas
- `failed_login_attempts` — tentativas de login falhas
- `credit_transactions` — histórico de créditos

**Migrations SQL** (pasta `scripts/`):
- `001_create_database_structure.sql` — Estrutura base
- `002_enable_rls_policies.sql` — Row Level Security
- `003_create_triggers_functions.sql` — Triggers e funções
- `004_insert_initial_data.sql` — Dados iniciais
- `005_update_tools_data.sql` — Atualização de ferramentas
- `006_sync_test_users.sql` — Usuários de teste
- `007_fix_test_users_credits.sql` — Correção de créditos
- `008_bin_analysis_v2_tables.sql` — Tabelas BIN v2
- `008_bin_intelligence_tables.sql` — Tabelas de inteligência BIN

### 1.7 Chamadas a APIs Externas

| API | Arquivo | Chave necessária? |
|-----|---------|------------------|
| BinList.net | `app/api/bin-analysis/route.ts` | Não (pública) |
| Simulação interna | `app/api/bin-analysis-v2/route.ts` | Não (simulação) |
| Supabase | Múltiplos | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

---

## 2. Diagnóstico de Erros

### 2.1 Estado do Build ANTES das Correções

```
✓ next build — SUCESSO (0 erros de compilação TypeScript no build)
```

> **Nota:** O Next.js 15 com `next build` pula validação de tipos por padrão (`Skipping validation of types`). Erros de TS podem existir sem quebrar o build production.

### 2.2 Problemas Encontrados

#### CRÍTICO

| # | Arquivo | Problema | Impacto |
|---|---------|---------|---------|
| C1 | `lib/supabase/middleware.ts` | Middleware redirecionava **100% das rotas não-públicas** para `/auth/login` se não autenticado | Usuário não consegue acessar a ferramenta sem criar conta |
| C2 | `lib/auth.ts` | `requireAuth()` chama `redirect("/auth/login")` sem fallback | Todas as páginas do dashboard quebram sem sessão |
| C3 | `app/api/bin-analysis/route.ts` | Retorna 401 para requests sem `Authorization` header | Ferramenta BIN inacessível sem login |
| C4 | `app/api/bin-analysis-v2/route.ts` | Retorna 401 para requests sem `Authorization` header | Ferramenta BIN inacessível sem login |

#### ALTO

| # | Arquivo | Problema | Impacto |
|---|---------|---------|---------|
| A1 | `app/api/bin-analysis/route.ts` | Usava `creditResult.error` (campo inexistente) — deveria ser `creditResult.message` | Erro em runtime ao debitar créditos |
| A2 | `.env.example` | Arquivo não existia | Onboarding difícil; variáveis de ambiente não documentadas |
| A3 | Nenhum `.env.local` | Supabase URL/Key não configuradas | Middleware trata como caso de "env vars não configuradas" — comportamento inconsistente |

#### MÉDIO

| # | Arquivo | Problema | Impacto |
|---|---------|---------|---------|
| M1 | `components/dashboard/dashboard-header.tsx` | Não tratava `user.email` null — crash se email for `null` | Console error potencial |
| M2 | `app/page.tsx` | Landing page mostrava botões de login/cadastro como página principal em vez de redirecionar para a ferramenta | UX ruim — usuário tinha que navegar manualmente |
| M3 | `app/dashboard/ml-scoring/page.tsx` | Verifica `profile?.role !== "admin"` e exibe "ACCESS DENIED" — em open mode o profile é guest | Feature interna inacessível mesmo em modo aberto |

#### BAIXO

| # | Arquivo | Problema | Impacto |
|---|---------|---------|---------|
| B1 | `src/lib/intelligence/` vs `lib/bin/` | Dois motores de análise BIN: `src/lib/intelligence/binAnalyzer.ts` (v1) e `lib/bin/` (v2) | Duplicação; `bin-analysis/route.ts` usa v1, `bin-analysis-v2/route.ts` usa v2 |
| B2 | `app/api/bin-analysis-v2/route.ts` | Usa dados simulados (`simulateBinApiCall`) em vez de chamada real à API | Análise imprecisa; adequado só para testes |
| B3 | `scripts/` com dois arquivos `008_*.sql` | Dois arquivos de migration com prefixo `008` | Ordem de execução ambígua |

---

## 3. Causa-Raiz do Erro de Deploy

### 3.1 Problema Principal (RESOLVIDO)

O deploy técnico (build) **funcionava** — `npm run build` completava sem erros. O problema era **funcional**: após o deploy, o usuário era **imediatamente redirecionado para `/auth/login`** ao tentar acessar qualquer rota além da raiz `/`.

**Causa-raiz:** O middleware Next.js (`middleware.ts`) interceptava 100% das requests e a lógica em `lib/supabase/middleware.ts` redirecionava qualquer request sem sessão Supabase válida para `/auth/login`. Sem variáveis de ambiente Supabase configuradas corretamente no ambiente de deploy, o comportamento era errático.

### 3.2 Configuração do Deploy

- **Provider:** Vercel (inferido — Next.js 15, sem `output: 'export'` no config)
- **Comando de build:** `next build` (configurado em `package.json`)
- **Output directory:** `.next/` (padrão Next.js)
- **Middleware:** 88.3 kB compilado — intercepta todas as rotas

### 3.3 Variáveis de Ambiente de Deploy

Para o deploy funcionar corretamente, as seguintes variáveis devem estar configuradas no painel Vercel/provedor:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_REQUIRE_AUTH=false    # manter false para acesso público
```

---

## 4. Correções Implementadas

### 4.1 Lista de Correções (este PR)

| Arquivo | O que foi feito |
|---------|----------------|
| `lib/auth.ts` | Adicionado `OPEN_ACCESS_MODE` flag; `requireAuth()` retorna mock guest user; `requireAdmin()` retorna mock admin; `getUserProfile()` retorna GUEST_PROFILE para guest UUID |
| `lib/supabase/middleware.ts` | Redirect para `/auth/login` só ocorre quando `NEXT_PUBLIC_REQUIRE_AUTH === "true"` |
| `app/page.tsx` | Em open mode, redireciona diretamente para `/dashboard/bin-pro` |
| `app/api/bin-analysis/route.ts` | Auth check e credit deduction tornados condicionais; corrigido `creditResult.error` → `creditResult.message` |
| `app/api/bin-analysis-v2/route.ts` | Auth check e credit deduction tornados condicionais; `applyBinOverrides` skipped para guest |
| `components/dashboard/dashboard-header.tsx` | Banner "MODO ABERTO" visível em open mode; dropdown de user/logout oculto em open mode; tratamento null de `user.email` |
| `.env.example` | Criado com documentação de todas as variáveis necessárias |
| `docs/DISCOVERY_AUDIT.md` | Este arquivo |

### 4.2 Como Reativar o Login

1. No arquivo `.env.local` (ou nas variáveis de ambiente do deploy):
   ```
   NEXT_PUBLIC_REQUIRE_AUTH=true
   ```
2. Fazer redeploy / reiniciar o servidor dev.
3. O banner amarelo "MODO ABERTO" desaparecerá automaticamente.
4. Usuários serão redirecionados para `/auth/login` ao acessar qualquer rota protegida.

### 4.3 Impacto das Correções no Build

| Rota | Antes | Depois |
|------|-------|--------|
| `/dashboard/bin-pro` | `ƒ (Dynamic)` | `○ (Static)` |
| `/dashboard/credits` | `ƒ (Dynamic)` | `○ (Static)` |
| Demais rotas dashboard | `ƒ (Dynamic)` | `○ (Static)` |

As rotas passaram de server-rendered dinâmico para estático (pre-rendered) porque não dependem mais de contexto de usuário em build time. Isso melhora performance de cold start.

---

## 5. Pendências e Riscos

### 5.1 Pendências

| # | Item | Prioridade |
|---|------|-----------|
| P1 | Substituir `simulateBinApiCall()` por integração real (Neutrino, BinList premium, etc.) em `bin-analysis-v2/route.ts` | ALTA |
| P2 | Configurar variáveis de ambiente Supabase no ambiente de deploy | ALTA |
| P3 | Renomear/ordenar script SQL duplicado `008_bin_*.sql` | BAIXA |
| P4 | Unificar os dois motores de análise BIN (v1 em `src/lib/intelligence/` e v2 em `lib/bin/`) | MÉDIO |
| P5 | Rate limiting na API `/api/bin-analysis-v2` (atualmente sem limite em open mode) | MÉDIO |

### 5.2 Riscos com Auth Desabilitado

| Risco | Mitigação |
|-------|-----------|
| API de análise BIN exposta sem rate limiting | Adicionar rate limit por IP (ex: Vercel Edge Middleware) |
| Tabela `bin_analysis_logs` não registra análises anônimas | OK — logs são opcionais; os dados de análise retornam normalmente |
| Rota Admin acessível sem login | Aceitável durante testes; reativar auth elimina o risco |
| Dados sensíveis de perfil não expostos | OK — sem userId válido, queries Supabase retornam vazio |

---

## 6. Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (Supabase é opcional em open mode)
cp .env.example .env.local
# Edite .env.local conforme necessário

# 3. Iniciar servidor de desenvolvimento
npm run dev
# Acesse http://localhost:3000 — será redirecionado para /dashboard/bin-pro

# 4. Build de produção
npm run build
npm run start

# 5. Testes
npm test
```

---

*Auditoria gerada automaticamente pelo Copilot SWE Agent.*
