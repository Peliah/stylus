import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { OrdersChart } from "@/components/dashboard/orders-chart"
import { PhoneDisplay } from "@/components/dashboard/phone-display"
import { SuggestionStatusBadge, OrderStatusBadge } from "@/components/dashboard/status-badge"
import { WhatsAppReconnectPanel } from "@/components/setup/whatsapp-reconnect-panel"
import { getDashboardStats } from "@/lib/dashboard-stats"
import { getActiveVendor } from "@/lib/vendor"
import { getVendorConnectionStatus } from "@/lib/whatsapp-connection"
import { getOutboundPendingCount } from "@/lib/outbound-queue"

export default async function DashboardPage() {
  const vendor = await getActiveVendor()
  const [connection, outboundPending, stats] = await Promise.all([
    getVendorConnectionStatus(vendor),
    getOutboundPendingCount(),
    getDashboardStats(vendor.id),
  ])

  const { gateway, connected } = connection

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Overview"
        description={`${vendor.name} — WhatsApp CRM`}
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/dashboard/suggestions" />}>
            Review suggestions
          </Button>
        }
      />

      <Card className={connected ? undefined : "border-amber-500/40 bg-amber-500/5"}>
        <CardHeader>
          <CardTitle className="text-sm">WhatsApp</CardTitle>
          <CardDescription>
            {connected ? (
              <span className="text-emerald-600 dark:text-emerald-400">Connected</span>
            ) : gateway.state === "unreachable" ? (
              <span className="text-destructive">Unavailable</span>
            ) : (
              <span className="text-amber-700 dark:text-amber-300">Not connected</span>
            )}
            {gateway.phone && ` · +${gateway.phone}`}
            {outboundPending > 0 && ` · ${outboundPending} queued`}
          </CardDescription>
        </CardHeader>
        {!connected && (
          <CardContent>
            <WhatsAppReconnectPanel phone={vendor.phoneNumber.replace("@c.us", "")} />
          </CardContent>
        )}
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending suggestions" value={stats.pendingSuggestions} href="/dashboard/suggestions" />
        <StatCard label="Revenue (7d)" value={`$${stats.revenue7d.toFixed(0)}`} href="/dashboard/orders" />
        <StatCard label="Orders (7d)" value={stats.orders7d} href="/dashboard/orders" />
        <StatCard label="Customers" value={stats.customerCount} href="/dashboard/customers" />
      </section>

      <OrdersChart data={stats.chartData} />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentSuggestions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No suggestions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentSuggestions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <PhoneDisplay phone={s.customerPhoneNumber} />
                      </TableCell>
                      <TableCell>
                        <SuggestionStatusBadge status={s.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.customer.name ?? <PhoneDisplay phone={o.customer.phoneNumber} />}</TableCell>
                      <TableCell className="tabular-nums">${o.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
