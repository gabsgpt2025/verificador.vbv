import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Shield, User, Settings, CreditCard } from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"
import { CyberNavigation } from "@/components/cyberpunk/cyber-navigation"
import Link from "next/link"

interface DashboardHeaderProps {
  user: any
  profile: any
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", active: true },
    { label: "BIN Pro 2.0", href: "/dashboard/bin-pro", variant: "accent" as const },
    { label: "Credits", href: "/dashboard/credits", variant: "secondary" as const },
    { label: "History", href: "/dashboard/credits/history", variant: "secondary" as const },
    ...(profile?.role === "admin" ? [{ label: "Admin", href: "/admin/dashboard", variant: "accent" as const }] : []),
  ]

  return (
    <header className="cyber-card border-b-0 sticky top-0 z-50 rounded-none">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="p-2 cyber-button rounded-lg transition-all duration-300 group-hover:scale-110">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary neon-glow font-mono tracking-wider">VeriFiBIN</h1>
          </Link>

          <div className="hidden md:block">
            <CyberNavigation items={navigationItems} />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-sm bg-primary/10 px-3 py-1 rounded-md border border-primary/30 neon-glow">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="font-bold text-primary text-lg">{profile?.credits || 0}</span>
            <span className="text-muted-foreground font-mono">CREDITS</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:neon-glow">
                <Avatar className="h-8 w-8 border border-primary/50">
                  <AvatarFallback className="bg-primary/20 text-primary border border-primary/30 font-mono font-bold">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 cyber-card" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-primary font-mono">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground font-mono">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild className="font-mono">
                <Link href="/dashboard/credits">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Manage Credits</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="font-mono">
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="font-mono">
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <LogoutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
