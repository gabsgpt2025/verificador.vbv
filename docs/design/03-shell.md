# 03 — AppShell unificado

## Arquitetura

`components/shell/AppShell.tsx`

```tsx
<TopBar />
<SideNav />
<main className="bg-bg-app">{children}</main>
```

Aplicado em `app/dashboard/layout.tsx`, cobrindo rotas `/dashboard/**`.

## TopBar (`components/shell/TopBar.tsx`)
- Esquerda: logo textual `VeriFiBIN`.
- Centro: breadcrumbs de rota.
- Direita: `CommandPaletteTrigger`, `ThemeToggle`, `UserMenu`.
- Estilo: `bg-bg-surface`, `border-border-subtle`, sticky com `z-sticky`.

## SideNav (`components/shell/SideNav.tsx`)
- Links com cor base uniforme: `text-fg-muted`.
- Item ativo: `text-fg`, `bg-bg-surface-hover`, barra lateral `bg-ds-accent`.
- Ícones Lucide com `aria-hidden`.
- Mobile: vira drawer usando `Sheet`.

## CommandPalette (`components/shell/CommandPalette.tsx`)
- Atalho global `Cmd+K` / `Ctrl+K`.
- Usa `Dialog`.
- Comandos iniciais:
  - Ir para Dashboard
  - Ir para BIN Pro
  - Verificar BIN
  - Ver Créditos
  - Configurações
  - Logout
  - Toggle theme

## ThemeToggle (`components/shell/ThemeToggle.tsx`)
- Implementado com `next-themes` (`attribute="data-theme"`).
- Dark default, Light opcional.
- Persistência automática em localStorage.

## Density tokens
Definidos em `app/globals.css`:

```css
[data-density='compact'] {
  --row-height: 32px;
  --card-padding: 12px;
  --gap-base: 8px;
}
[data-density='comfortable'] {
  --row-height: 44px;
  --card-padding: 24px;
  --gap-base: 16px;
}
```

`UserMenu` inclui ações para alternar densidade.
