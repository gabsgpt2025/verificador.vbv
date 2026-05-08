import type * as React from "react"
import { cn } from "@/lib/utils"

interface CyberHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
  variant?: "primary" | "secondary" | "accent" | "muted"
  glow?: boolean
}

export function CyberHeading({
  level = 1,
  variant = "primary",
  glow = true,
  className,
  children,
  ...props
}: CyberHeadingProps) {
  const Component = `h${level}` as React.ElementType

  const baseClasses = "font-mono font-bold tracking-wider"

  const sizeClasses = {
    1: "text-4xl md:text-5xl lg:text-6xl",
    2: "text-3xl md:text-4xl lg:text-5xl",
    3: "text-2xl md:text-3xl lg:text-4xl",
    4: "text-xl md:text-2xl lg:text-3xl",
    5: "text-lg md:text-xl lg:text-2xl",
    6: "text-base md:text-lg lg:text-xl",
  }

  const variantClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
    muted: "text-muted-foreground",
  }

  return (
    <Component
      className={cn(baseClasses, sizeClasses[level], variantClasses[variant], glow && "neon-glow", className)}
      {...props}
    >
      {children}
    </Component>
  )
}

interface CyberTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "body" | "caption" | "code"
  color?: "primary" | "secondary" | "accent" | "muted" | "foreground" | "destructive"
}

export function CyberText({ variant = "body", color = "foreground", className, children, ...props }: CyberTextProps) {
  const baseClasses = "font-mono"

  const variantClasses = {
    body: "text-sm md:text-base leading-relaxed",
    caption: "text-xs md:text-sm leading-tight",
    code: "text-xs md:text-sm font-bold tracking-wide bg-muted/20 px-2 py-1 rounded border border-border/50",
  }

  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
    muted: "text-muted-foreground",
    foreground: "text-foreground",
    destructive: "text-destructive",
  }

  return (
    <p className={cn(baseClasses, variantClasses[variant], colorClasses[color], className)} {...props}>
      {children}
    </p>
  )
}
