# 02 — Componentes base e domínio

## Base refatorados (tokens semânticos)

### Button (`components/ui/button.tsx`)
- Variants: `primary | secondary | ghost | destructive | accent | link` (compat: `default`, `outline`)
- Sizes: `sm | md | lg | icon`
- Estado `loading` com `aria-busy="true"` + spinner interno.

```tsx
<Button variant="primary" loading>Salvar</Button>
```

### Input / Textarea (`components/ui/input.tsx`, `components/ui/textarea.tsx`)
- `error?: boolean` ativa `aria-invalid` e borda semântica de erro.
- Suportam `aria-describedby` para mensagem de erro.

```tsx
<Input error aria-describedby="email-error" />
```

### Card (`components/ui/card.tsx`)
- Variants: `surface` (default), `elevated`, `interactive`
- API mantida: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

### Badge (`components/ui/badge.tsx`)
- Variants: `neutral | info | success | warning | danger | accent | risk-low | risk-medium | risk-high | risk-critical`
- Padrão visual: `text-xs font-medium px-2 py-0.5 rounded-full`

### Tabs (`components/ui/tabs.tsx`)
- `TabsList` com `role="tablist"`
- Trigger ativa: `border-b-2 border-ds-accent text-fg`
- Inativa: `text-fg-muted hover:text-fg`

### Label / Select / Alert / Progress / Avatar / Table / DropdownMenu
- Todos atualizados para consumir tokens semânticos (`bg-bg-*`, `text-fg*`, `border-border-*`, `text-status-*`, etc.)
- Sem hex hardcoded em `components/ui/*`.

## Novos componentes base

### Tooltip (`components/ui/tooltip.tsx`)
- Estilo: `text-xs bg-bg-surface-elevated border border-border-default rounded-md shadow-md px-2 py-1`

### Skeleton (`components/ui/skeleton.tsx`)
- `bg-bg-surface-elevated animate-pulse rounded-md`
- `motion-reduce:animate-none`

### Spinner (`components/ui/spinner.tsx`)
- SVG inline (`currentColor`)
- Sizes: `sm | md | lg`
- `aria-label="Loading"`

### Sheet / Dialog
- `components/ui/sheet.tsx` para drawer mobile
- `components/ui/dialog.tsx` para modais e palette

### Toast
- `components/ui/toaster.tsx` (Sonner)
- Montado no layout raiz.

## Componentes de domínio

### RiskIndicator (`components/ui/risk-indicator.tsx`)
Componente-âncora do produto antifraude.

Props:
- `level: 'low' | 'medium' | 'high' | 'critical'`
- `score?: number`
- `label?: string`
- `showIcon?: boolean`
- `showScore?: boolean`
- `size?: 'sm' | 'md' | 'lg'`
- `variant?: 'badge' | 'inline' | 'card'`
- `tooltip?: string`

Acessibilidade:
- `role="status"`
- `aria-label` descritivo
- Cor nunca é único indicador (ícone + texto + score).

```tsx
<RiskIndicator level="high" score={78} variant="card" />
```

### MetricCard (`components/ui/metric-card.tsx`)
Props:
- `label`, `value`
- `formatAs?: 'number' | 'currency' | 'percent' | 'text'`
- `currency?: 'BRL' | 'USD' | 'EUR'`
- `delta?: { value; label?; direction? }`
- `icon?`, `tooltip?`, `loading?`

- Formatação via `Intl` (`pt-BR`) usando `lib/format.ts`.
- Loading com `Skeleton`.

```tsx
<MetricCard label="Receita" value={10500} formatAs="currency" currency="BRL" />
```

### EmptyState (`components/ui/empty-state.tsx`)
- Ícone + título + descrição + CTA opcional.

```tsx
<EmptyState title="Sem dados" description="Faça sua primeira verificação." />
```

## Utilitário de formatação

`lib/format.ts`
- `formatNumber`
- `formatCurrency`
- `formatPercent`
- `formatRelativeTime`
- `maskBin`
