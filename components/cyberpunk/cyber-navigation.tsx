import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CyberNavigationProps {
  items: Array<{
    label: string
    href: string
    active?: boolean
    variant?: "default" | "secondary" | "accent"
  }>
  className?: string
}

export function CyberNavigation({ items, className }: CyberNavigationProps) {
  return (
    <nav className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item, index) => (
        <Button
          key={index}
          asChild
          variant={item.active ? "default" : item.variant || "outline"}
          size="sm"
          className={cn("transition-all duration-300", item.active && "neon-glow scale-105")}
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  )
}
