import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"
import { PageHeader } from "@/components/dashboard/page-header"
import { DashboardEmptyState } from "@/components/dashboard/empty-state"
import { OrderStatusBadge } from "@/components/dashboard/status-badge"
import { PhoneDisplay } from "@/components/dashboard/phone-display"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Button } from "@workspace/ui/components/button"

export default async function OrdersPage() {
  const vendor = await getActiveVendor()

  const orders = await prisma.order.findMany({
    where: { vendorId: vendor.id },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Orders"
        description="Created when you approve suggestions with order actions."
      />

      {orders.length === 0 ? (
        <DashboardEmptyState
          title="No orders yet"
          description="Approve a suggestion with a proposed order to create one."
          action={
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard/suggestions" />}>
              View suggestions
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  {order.customer.name ?? <PhoneDisplay phone={order.customer.phoneNumber} />}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                  {order.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                </TableCell>
                <TableCell className="tabular-nums font-medium">
                  ${order.totalPrice.toFixed(2)}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatWhen(order.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="xs" variant="outline" nativeButton={false} render={<Link href={`/dashboard/orders/${order.id}`} />}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
