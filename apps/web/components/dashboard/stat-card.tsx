import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export function StatCard({
  label,
  value,
  href,
}: {
  label: string
  value: number | string
  href: string
}) {
  return (
    <Link href={href} className="block transition-opacity hover:opacity-90">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
