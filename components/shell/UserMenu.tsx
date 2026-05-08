'use client'

import { CreditCard, LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  user: { email?: string | null }
  profile: { full_name?: string | null; credits?: number | null }
}

function UserMenu({ user, profile }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const displayName = profile.full_name || user.email || 'Guest'
  const avatarInitial = displayName.charAt(0).toUpperCase()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      router.push('/auth/login')
      setIsLoggingOut(false)
    }
  }

  const setDensity = (density: 'compact' | 'comfortable') => {
    document.documentElement.setAttribute('data-density', density)
    window.localStorage.setItem('app-density', density)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Abrir menu do usuário">
          <Avatar>
            <AvatarFallback>{avatarInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-fg">{displayName}</p>
            {user.email ? <p className="text-xs text-fg-muted">{user.email}</p> : null}
            <p className="text-xs text-fg-muted">Créditos: {profile.credits ?? 0}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/credits">
            <CreditCard aria-hidden="true" /> Ver Créditos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User aria-hidden="true" /> Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden="true" /> Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setDensity('comfortable')}>Densidade confortável</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDensity('compact')}>Densidade compacta</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
          <LogOut aria-hidden="true" /> {isLoggingOut ? 'Saindo...' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }
