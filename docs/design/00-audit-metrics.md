# Fase 0 — Auditoria com Métricas Reais

> Inventário objetivo do estado atual do codebase visual do VeriFiBIN v0.2.0.
> Substituir achismo por dados antes de qualquer mudança de código.

---

## 1. Inventário de Cores Hardcoded

Padrão buscado: `#[0-9A-Fa-f]{3,8}` em `app/`, `components/`, `lib/` (`.tsx`, `.ts`, `.css`)

### Cores por arquivo (top ofensores)

| Arquivo | Ocorrências | Cores encontradas |
|---------|-------------|-------------------|
| `app/globals.css` | 26 | `#0a0a0a`, `#f1f5f9`, `#1e293b`, `#94a3b8`, `#ffffff` |
| `lib/premium-3-0/presentation.ts` | 4 | `#22c55e`, `#eab308`, `#f97316`, `#ef4444` |

**Total de ocorrências de hex hardcoded:** ~30 (concentradas em globals.css e apresentação de risco)

### Observação
A maioria das cores hardcoded está nos tokens shadcn/ui em `globals.css` (variáveis CSS), não espalhada por componentes `.tsx`. Isso é um ponto positivo — a refatoração é cirúrgica.

Cores hardcoded em `lib/premium-3-0/presentation.ts` são para indicadores de risco (baixo/médio/alto/crítico) usados apenas em cálculos de apresentação, não em CSS de componentes.

---

## 2. Inventário de Componentes shadcn/ui

Componentes presentes em `components/ui/`:

| Componente | Arquivo |
|-----------|---------|
| Alert | `components/ui/alert.tsx` |
| Avatar | `components/ui/avatar.tsx` |
| Badge | `components/ui/badge.tsx` |
| Button | `components/ui/button.tsx` |
| Card | `components/ui/card.tsx` |
| Dropdown Menu | `components/ui/dropdown-menu.tsx` |
| Input | `components/ui/input.tsx` |
| Label | `components/ui/label.tsx` |
| Progress | `components/ui/progress.tsx` |
| Select | `components/ui/select.tsx` |
| Table | `components/ui/table.tsx` |
| Tabs | `components/ui/tabs.tsx` |
| Textarea | `components/ui/textarea.tsx` |

**Total: 13 componentes shadcn/ui instalados**

Componentes prioritários para Fase 2 (não instalados ainda): Dialog, Toast, Tooltip, Sheet, Skeleton, Spinner.

---

## 3. Inventário de Páginas (Rotas)

| Rota | Arquivo |
|------|---------|
| `/` | `app/page.tsx` |
| `/auth/login` | `app/auth/login/page.tsx` |
| `/auth/register` | `app/auth/register/page.tsx` |
| `/auth/verify-email` | `app/auth/verify-email/page.tsx` |
| `/dashboard` | `app/dashboard/page.tsx` ← **piloto Fase 1** |
| `/dashboard/bin-pro` | `app/dashboard/bin-pro/page.tsx` |
| `/dashboard/credits` | `app/dashboard/credits/page.tsx` |
| `/dashboard/credits/history` | `app/dashboard/credits/history/page.tsx` |
| `/dashboard/currency` | `app/dashboard/currency/page.tsx` |
| `/dashboard/ml-scoring` | `app/dashboard/ml-scoring/page.tsx` |
| `/premium-3-0` | `app/premium-3-0/page.tsx` |
| `/profile` | `app/profile/page.tsx` |
| `/settings` | `app/settings/page.tsx` |
| `/admin` | `app/admin/page.tsx` |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` |

**Total: 15 páginas** (5 dashboard, 4 auth/admin, 3 usuário, 3 outras)

---

## 4. Uso de Emojis como Ícones

Emojis encontrados em arquivos `.tsx` (candidatos a substituição por `lucide-react`):

| Arquivo | Linha | Emoji | Substituição sugerida |
|---------|-------|-------|----------------------|
| `components/premium-3-0/Premium3DAnalyzer.tsx` | 25 | `🔧` (Modo Técnico) | `<Wrench>` (lucide) |
| `components/premium-3-0/Premium3DAnalyzer.tsx` | 29 | `👥` (Modo Popular) | `<Users>` (lucide) |
| `components/premium-3-0/Premium3DAnalyzer.tsx` | 401–404 | `🟢🟡🟠` (status) | `<Circle>` com cor semântica |
| `components/bin-pro/ml-scoring-dashboard.tsx` | 110–115 | `🌍📊🏦💳⚡🔍` (fatores) | `<Globe>`, `<BarChart2>`, `<Building2>`, `<CreditCard>`, `<Zap>`, `<Search>` |

**Total: 9 emojis como ícones** — migração planejada para Fase 3.

---

## 5. Uso de `style={{...}}` Inline

| Arquivo | Linha | Uso |
|---------|-------|-----|
| `components/ui/progress.tsx` | 25 | `style={{ transform: \`translateX(-${100 - value}%)\` }}` — necessário (animação CSS) |
| `components/bin-pro/ml-scoring-dashboard.tsx` | 124 | `style={{ width: \`${(factor.weight / 25) * 100}%\` }}` — pode virar variável CSS |

**Total: 2 usos de style inline** — baixíssimo, praticamente sem problema.

---

## 6. Cores Neon Detectadas

Cores da paleta "neon conflitante" citadas na auditoria:

| Cor | Hex | Encontrada no código? |
|-----|-----|----------------------|
| Ciano neon | `#00FFFF` | ❌ Não encontrada diretamente |
| Magenta neon | `#FF00FF` | ❌ Não encontrada diretamente |
| Verde neon | `#00FF00` | ❌ Não encontrada diretamente |
| Amarelo neon | `#FFFF00` | ❌ Não encontrada diretamente |
| Laranja neon | `#FF6600` | ❌ Não encontrada diretamente |
| Roxo neon | `#9D4EDD` | ❌ Não encontrada diretamente |

**As cores neon estão principalmente via hsl()**, não hex direto:
- `hsl(217, 91%, 60%)` — azul saturado (primary)
- `hsl(142, 76%, 36%)` — verde (secondary)
- `hsl(25, 95%, 53%)` — laranja vibrante (accent)
- `text-shadow` e `box-shadow` neon em `.neon-glow`, `.neon-border`, `.cyber-card`, `.cyber-button`

**Decisão:** Manter `.neon-glow`, `.cyber-card`, `.cyber-button` como classes legadas para componentes compartilhados não migrados ainda. Remover apenas da página-piloto (Dashboard).

---

## 7. Checklist de Acessibilidade Pendente

| Item | Status | Prioridade |
|------|--------|-----------|
| `:focus-visible` padronizado em todos os elementos interativos | ⚠️ Parcial (reset via `outline-ring/50` no `*`) | Alta |
| `aria-label` em ícones sem texto | ⚠️ Ausente em vários ícones lucide-react | Alta |
| Contraste WCAG AA (4.5:1 body, 3:1 UI grande) | ⚠️ Não medido — `hsl(217, 91%, 60%)` sobre `#0a0a0a` pode estar abaixo | Alta |
| `prefers-reduced-motion` respeitado | ❌ Ausente — `.cyber-card:hover` e `.cyber-button:hover` sem proteção | Média |
| `aria-live` em resultados dinâmicos (BIN lookup) | ❌ Ausente | Média |
| Navegação por teclado em todos os fluxos | ⚠️ Parcial (Radix/shadcn ajuda, mas não cobre tudo) | Média |
| `aria-busy` em botões de loading | ❌ Ausente | Baixa |
| `role` e `aria-selected` em Toggle Técnico/Popular | ❌ Bug UX identificado na auditoria | Alta |

---

## Resumo Executivo

| Métrica | Valor | Avaliação |
|---------|-------|-----------|
| Cores hex hardcoded em componentes | ~2 (presentation.ts) | 🟢 Baixo |
| Cores via hsl() no globals.css | ~15 tokens | 🟡 Médio |
| Emojis como ícones | 9 | 🟡 Médio |
| Uso de `style={{}}` inline | 2 | 🟢 Baixo |
| Componentes shadcn instalados | 13/~25 necessários | 🟡 Médio |
| Cobertura de `prefers-reduced-motion` | 0% | 🔴 Alto |
| `focus-visible` padronizado | Parcial | 🟡 Médio |

**Conclusão:** O código está em melhor estado do que a auditoria visual sugeria. O problema principal são os **tokens visuais** (paleta de cores neon, glow effects excessivos) e não arquitetura de código. Refatoração orientada a tokens é a abordagem correta.
