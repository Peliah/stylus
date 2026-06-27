import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"
import { PageHeader } from "@/components/dashboard/page-header"
import { OrderStatusBadge } from "@/components/dashboard/status-badge"
import { PhoneDisplay } from "@/components/dashboard/phone-display"
import { updateOrderStatusAction } from "../actions"

const STATUSES = ["DRAFT", "PENDING", "PAID", "SHIPPED", "CANCELLED"] as const

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const vendor = await getActiveVendor()

  const order = await prisma.order.findFirst({
    where: { id, vendorId: vendor.id },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  })

  if (!order) notFound()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title={`Order ${order.id.slice(0, 8)}`}
        description={formatWhen(order.createdAt)}
        actions={
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard/orders" />}>
            Back to orders
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              {order.customer.name ?? <PhoneDisplay phone={order.customer.phoneNumber} />}
            </CardTitle>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            <PhoneDisplay phone={order.customer.phoneNumber} />
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${(item.price * item.quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="text-lg font-semibold tabular-nums">
            Total: ${order.totalPrice.toFixed(2)}
          </p>

          <form action={updateOrderStatusAction.bind(null, order.id)} className="flex flex-wrap items-end gap-3">
            <Field>
              <FieldLabel htmlFor="status">Update status</FieldLabel>
              <NativeSelect id="status" name="status" defaultValue={order.status} className="w-40">
                {STATUSES.map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {s.toLowerCase()}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Button type="submit" size="sm">
              Save status
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
