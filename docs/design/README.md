# VeriFiBIN Design System

> **Abordagem:** Refatoração orientada a tokens (não rewrite do zero).
> O stack atual (Next.js 15 + Tailwind v4 + shadcn/ui) já suporta um DS profissional — o problema eram as decisões de tokens, não o código.

---

## Fases

| Fase | Nome | Status | Arquivos-chave |
|------|------|--------|----------------|
| **0** | Inventário & Métricas | ✅ Completo | `docs/design/00-audit-metrics.md` |
| **1** | Design Tokens (fundação) | ✅ Completo | `app/globals.css`, `docs/design/01-tokens.md` |
| **2** | Componentes Base | ✅ Completo | `components/ui/*`, `docs/design/02-components.md` |
| **3** | Layout Shell & Navegação | ✅ Completo | `components/shell/*`, `app/dashboard/layout.tsx`, `docs/design/03-shell.md` |
| **4** | Migração de Páginas | 🔜 Futuro | BIN Pro, Credits, History, Admin |
| **5** | Acessibilidade & QA | 🔜 Contínuo | axe-core CI, NVDA/VoiceOver |
| **6** | Governança & Documentação | 🔜 Futuro | Storybook, Chromatic, ADRs |

---

## Estrutura de documentação

```
docs/design/
├── README.md              ← este arquivo (índice das fases)
├── 00-audit-metrics.md    ← Fase 0: inventário real de código
├── 01-tokens.md           ← Fase 1: catálogo de design tokens
├── 02-components.md       ← Fase 2: componentes base + domínio
└── 03-shell.md            ← Fase 3: AppShell unificado
```

---

## Princípios-guia

1. **Tokens antes de componentes** — nenhum valor de cor, raio ou sombra é hardcoded; tudo referencia uma variável CSS semântica.
2. **Primitives → Semantics → Components** — três camadas distintas, nunca pular direto para componentes.
3. **Acessibilidade como requisito** — contraste WCAG AA mínimo, `prefers-reduced-motion`, `:focus-visible` em todo elemento interativo.
4. **Zero glow neon** — sombras sutis, sem `text-shadow` neon. Confiança transmitida por hierarquia, não por efeitos.
5. **Migração em ondas** — nenhuma mudança visual quebra funcionalidade existente (Neutrino, Supabase, BIN Lookup, créditos, auth).

---

## Stack

- **Next.js 15** (App Router)
- **Tailwind CSS v4** — tokens via `@theme` em `app/globals.css`
- **shadcn/ui** — componentes base (Radix UI)
- **lucide-react** — iconografia (substituir emojis)
- **geist/font** — tipografia (Sans + Mono)

---

## Página-piloto (Fase 1)

`app/dashboard/page.tsx` — refatorada para consumir tokens semânticos.
Demais páginas serão migradas nas Fases 4.x.

---

## Diferenciais Enterprise

- **CommandPalette** (Cmd/Ctrl + K)
- **Light/Dark mode** com `next-themes`
- **Density tokens** (`compact` / `comfortable`)
- **RiskIndicator** (componente-âncora antifraude)
- **Intl formatters** centralizados em `lib/format.ts`
