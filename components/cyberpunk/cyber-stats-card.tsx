import type * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CyberStatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: React.ReactNode
  className?: string
}

export function CyberStatsCard({ title, value, change, changeType = "neutral", icon, className }: CyberStatsCardProps) {
  const getBadgeVariant = () => {
    switch (changeType) {
      case "positive":
        return "secondary"
      case "negative":
        return "destructive"
      case "neutral":
        return "accent"
      default:
        return "default"
    }
  }

  return (
    <Card className={cn("group hover:scale-105 transition-all duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-primary neon-glow">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary neon-glow mb-2">{value}</div>
        {change && (
          <Badge variant={getBadgeVariant()} className="text-xs">
            {change}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
