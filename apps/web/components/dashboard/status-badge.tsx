import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

const orderStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PENDING: "secondary",
  PAID: "default",
  SHIPPED: "default",
  CANCELLED: "destructive",
}

const suggestionStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
}

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={orderStatusVariant[status] ?? "outline"} className={cn(className)}>
      {status.toLowerCase()}
    </Badge>
  )
}

export function SuggestionStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={suggestionStatusVariant[status] ?? "outline"} className={cn(className)}>
      {status.toLowerCase()}
    </Badge>
  )
}
