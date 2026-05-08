'use client'

import { CreditCard, Gauge, History, Menu, Shield, Wallet } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/dashboard/bin-pro', label: 'BIN Pro', icon: Shield },
  { href: '/dashboard/credits', label: 'Créditos', icon: Wallet },
  { href: '/dashboard/credits/history', label: 'Histórico', icon: History },
  { href: '/dashboard/currency', label: 'Moedas', icon: CreditCard },
]

function NavContent() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegação principal" className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex items-center gap-2 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-surface-hover hover:text-fg',
              isActive && 'bg-bg-surface-hover text-fg',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive ? <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-ds-accent" aria-hidden="true" /> : null}
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SideNav() {
  return (
    <>
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 border-r border-border-subtle bg-bg-surface p-3 lg:block">
        <NavContent />
      </aside>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu lateral">
              <Menu className="size-4" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-3">
            <SheetTitle className="sr-only">Navegação</SheetTitle>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

export { SideNav }
