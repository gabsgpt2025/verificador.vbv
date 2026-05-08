/**
 * [DESIGN-SYSTEM] Local StatsCard for Dashboard pilot page (Fase 1).
 * Uses semantic token classes instead of CyberStatsCard (which has neon-glow).
 * Shared CyberStatsCard will be unified in Fase 3 (Layout Shell).
 */
import type * as React from "react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: React.ReactNode
  className?: string
}

export function StatsCard({ title, value, change, changeType = "neutral", icon, className }: StatsCardProps) {
  const changeBadgeClass = {
    positive: "text-status-success",
    negative: "text-status-danger",
    neutral: "text-fg-muted",
  }[changeType]

  return (
    <div
      className={cn(
        "bg-bg-surface border border-border-subtle rounded-lg shadow-sm p-6 flex flex-col gap-3",
        "transition-colors duration-[var(--duration-base)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fg-muted uppercase tracking-wide">{title}</span>
        {icon && (
          <div className="text-ds-accent" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-fg">{value}</div>
      {change && <div className={cn("text-xs", changeBadgeClass)}>{change}</div>}
    </div>
  )
}
