# Fase 1 — Design Tokens (Fundação)

> Catálogo completo de tokens do VeriFiBIN Design System.
> Filosofia: **Primitives → Semantics → Components**

---

## Filosofia de Três Camadas

```
Primitives (valores brutos)
    ↓
Semantic Tokens (significado contextual)
    ↓
Component Tokens (uso específico por componente)
```

**Primitives** são valores sem semântica: `--neutral-900`, `--blue-500`. Nunca usados diretamente em componentes.

**Semantic tokens** têm intenção: `--bg-surface`, `--text-muted`, `--border-subtle`. São esses que os componentes consomem.

**Component tokens** são específicos: `--button-primary-bg`, `--card-shadow`. Definidos nas Fases 2+.

---

## Primitivos de Cor (oklch)

> `oklch(lightness chroma hue)` — espaço perceptual uniforme. Mudanças de chroma/hue não alteram luminosidade percebida, garantindo consistência de contraste.

| Token | Valor oklch | Equivalente aprox. |
|-------|-------------|-------------------|
| `--neutral-0` | `oklch(1 0 0)` | Branco puro `#ffffff` |
| `--neutral-50` | `oklch(0.985 0 0)` | `#f9f9f9` |
| `--neutral-100` | `oklch(0.96 0 0)` | `#f3f3f3` |
| `--neutral-200` | `oklch(0.92 0 0)` | `#e8e8e8` |
| `--neutral-300` | `oklch(0.84 0 0)` | `#d4d4d4` |
| `--neutral-400` | `oklch(0.66 0 0)` | `#a3a3a3` |
| `--neutral-500` | `oklch(0.52 0 0)` | `#737373` |
| `--neutral-600` | `oklch(0.40 0 0)` | `#525252` |
| `--neutral-700` | `oklch(0.30 0.005 250)` | `#3a3a40` |
| `--neutral-800` | `oklch(0.22 0.008 250)` | `#27272e` |
| `--neutral-850` | `oklch(0.18 0.01 250)` | `#1e1e24` |
| `--neutral-900` | `oklch(0.14 0.012 250)` | `#16161c` |
| `--neutral-950` | `oklch(0.10 0.014 250)` | `#0e0e14` |
| `--blue-400` | `oklch(0.74 0.13 240)` | `#6eb5f5` |
| `--blue-500` | `oklch(0.62 0.17 245)` | `#3b82f6` |
| `--blue-600` | `oklch(0.54 0.18 250)` | `#2563eb` |
| `--blue-700` | `oklch(0.46 0.16 252)` | `#1d4ed8` |
| `--green-500` | `oklch(0.70 0.16 150)` | `#22c55e` |
| `--amber-500` | `oklch(0.78 0.16 80)` | `#f59e0b` |
| `--orange-600` | `oklch(0.68 0.18 45)` | `#ea580c` |
| `--red-600` | `oklch(0.60 0.22 25)` | `#dc2626` |

---

## Tokens Semânticos

### Background

| Token CSS | Valor | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--bg-app` | `var(--neutral-950)` | `bg-bg-app` | Fundo base do app |
| `--bg-surface` | `var(--neutral-900)` | `bg-bg-surface` | Cards, painéis |
| `--bg-surface-elevated` | `var(--neutral-850)` | `bg-bg-surface-elevated` | Cards sobre cards, dropdowns |
| `--bg-surface-hover` | `var(--neutral-800)` | `bg-bg-surface-hover` | Estado hover de itens de lista |

### Texto

| Token CSS | Valor | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--text-primary` | `var(--neutral-50)` | `text-fg` | Texto principal, headings |
| `--text-secondary` | `var(--neutral-300)` | `text-fg-secondary` | Descrições, subtítulos |
| `--text-muted` | `var(--neutral-400)` | `text-fg-muted` | Placeholders, meta-info |
| `--text-disabled` | `var(--neutral-600)` | `text-fg-disabled` | Elementos desabilitados |
| `--text-on-accent` | `var(--neutral-0)` | `text-fg-on-accent` | Texto sobre fundo accent |

### Bordas

| Token CSS | Valor | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--border-subtle` | `var(--neutral-800)` | `border-border-subtle` | Divisores sutis, cards normais |
| `--border-default` | `var(--neutral-700)` | `border-border-default` | Bordas de input, separadores |
| `--border-strong` | `var(--neutral-600)` | `border-border-strong` | Elementos em foco (sem ring) |

### Accent (ação primária)

| Token CSS | Valor | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--ds-accent` | `var(--blue-500)` | `text-ds-accent`, `bg-ds-accent` | CTA principal, links, ícones-chave |
| `--ds-accent-hover` | `var(--blue-400)` | `text-ds-accent-hover` | Estado hover do accent |
| `--ds-accent-active` | `var(--blue-600)` | `text-ds-accent-active` | Estado pressed |
| `--focus-ring` | `var(--blue-400)` | — (usado via `--shadow-focus`) | Ring de foco, acessibilidade |

### Risco (domínio antifraude)

| Token CSS | Valor | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--risk-low` | `var(--green-500)` | `text-risk-low` | Risco baixo (0–20) |
| `--risk-medium` | `var(--amber-500)` | `text-risk-medium` | Risco médio (21–50) |
| `--risk-high` | `var(--orange-600)` | `text-risk-high` | Risco alto (51–75) |
| `--risk-critical` | `var(--red-600)` | `text-risk-critical` | Risco crítico (76–100) |

> ⚠️ **Princípio:** Cor nunca é o único indicador de risco. Sempre combinar com ícone + texto.

### Status

| Token CSS | Valor | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--status-success` | `var(--green-500)` | `text-status-success` | Sucesso, aprovado |
| `--status-warning` | `var(--amber-500)` | `text-status-warning` | Aviso, pendente |
| `--status-danger` | `var(--red-600)` | `text-status-danger` | Erro, falha |
| `--status-info` | `var(--blue-500)` | `text-status-info` | Informação, processo |

---

## Radius

| Token CSS | Valor | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--radius-sm` | `6px` | `rounded-sm` | Badges, chips |
| `--radius-md` | `10px` | `rounded-md` | Inputs, botões |
| `--radius-lg` | `14px` | `rounded-lg` | Cards |
| `--radius-xl` | `20px` | `rounded-xl` | Modais, sheets |
| `--radius-full` | `9999px` | `rounded-full` | Avatares, pills |

---

## Sombras (sutis, sem glow neon)

| Token CSS | Valor | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--ds-shadow-xs` | `0 1px 2px rgb(0 0 0/0.25)` | `shadow-xs` | Elevação mínima |
| `--ds-shadow-sm` | `0 2px 4px... + 0 1px 2px...` | `shadow-sm` | Cards, botões |
| `--ds-shadow-md` | `0 4px 8px... + 0 2px 4px...` | `shadow-md` | Dropdowns, popovers |
| `--ds-shadow-lg` | `0 12px 24px... + 0 4px 8px...` | `shadow-lg` | Modais |
| `--ds-shadow-focus` | `0 0 0 3px color-mix(blue 40%)` | `shadow-focus` | Ring de foco (`:focus-visible`) |

> ✅ **Sem box-shadow neon.** Glow reservado apenas para estados de foco via `--shadow-focus`.

---

## Motion

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Entradas, fade-in |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Transições de estado |
| `--duration-fast` | `120ms` | Micro-interações (hover, ripple) |
| `--duration-base` | `200ms` | Transições padrão |
| `--duration-slow` | `320ms` | Animações de layout |

> ✅ `prefers-reduced-motion: reduce` garante `0.01ms` para todas as animações/transições.

---

## Tipografia

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--font-size-xs` | `0.75rem` (12px) | Labels, captions |
| `--font-size-sm` | `0.8125rem` (13px) | Body small, meta |
| `--font-size-base` | `0.875rem` (14px) | Body padrão |
| `--font-size-md` | `1rem` (16px) | Body médio |
| `--font-size-lg` | `1.125rem` (18px) | Subtítulos |
| `--font-size-xl` | `1.375rem` (22px) | Títulos de seção |
| `--font-size-2xl` | `1.75rem` (28px) | Page heading |
| `--font-size-3xl` | `2.25rem` (36px) | Hero heading |
| `--line-height-tight` | `1.2` | Headings |
| `--line-height-base` | `1.5` | Body |
| `--line-height-relaxed` | `1.65` | Long-form |

---

## Z-Index

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--z-dropdown` | `1000` | Dropdowns |
| `--z-sticky` | `1020` | Header sticky |
| `--z-overlay` | `1040` | Overlays de fundo |
| `--z-modal` | `1050` | Modais |
| `--z-toast` | `1080` | Notificações toast |
| `--z-tooltip` | `1090` | Tooltips |

---

## Princípios de Cor

### ✅ Fazer
- Usar tokens semânticos (`text-fg-muted`, `bg-bg-surface`)
- Combinar cor + ícone + texto para indicar risco/status
- Manter contraste mínimo 4.5:1 para texto (WCAG AA)
- Usar `--ds-accent` (azul) para CTAs e ações primárias

### ❌ Não fazer
- Usar valores hex hardcoded em componentes (`#00FFFF`, `#22c55e`)
- Usar `text-shadow` neon em texto comum
- Usar cor como único indicador de estado
- Usar mais de 3 cores saturadas na mesma tela

---

## Exemplos de Classes Tailwind (v4)

```tsx
// Card padrão
<div className="bg-bg-surface border border-border-subtle rounded-lg shadow-sm p-6">

// Heading principal
<h2 className="text-2xl font-semibold text-fg">

// Texto secundário
<p className="text-sm text-fg-muted">

// Ícone de ação
<Shield className="h-5 w-5 text-ds-accent" aria-hidden="true" />

// Indicador de risco crítico
<span className="text-risk-critical flex items-center gap-1">
  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
  Risco Crítico
</span>

// Item de lista com hover
<div className="p-3 bg-bg-surface-elevated border border-border-subtle rounded-lg hover:bg-bg-surface-hover transition-colors">
```

---

## Migração (próximas fases)

- **Fase 2** — Componentes base (Button, Input, Card, Badge, RiskIndicator) consumindo tokens
- **Fase 3** — AppShell/Navbar unificado, migração de emojis para lucide-react
- **Fase 4** — Demais páginas (BIN Pro, Credits, History, Admin)
- **Fase 5** — Auditoria axe-core, testes NVDA/VoiceOver
- **Fase 6** — Storybook, Chromatic, ADR template, PR template com checklist de a11y
