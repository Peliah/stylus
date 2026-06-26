import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Created when you approve suggestions with order actions.
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted-foreground border-border bg-card rounded-xl border p-6 text-sm">
          No orders yet. Approve a suggestion with a proposed order to create one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <article key={order.id} className="border-border bg-card rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {order.customer.name ?? formatPhone(order.customer.phoneNumber)}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {formatPhone(order.customer.phoneNumber)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums">
                    ${order.totalPrice.toFixed(2)}
                  </p>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="text-muted-foreground">
                    {item.quantity}× {item.product.name}
                    <span className="text-foreground ms-2 tabular-nums">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="text-muted-foreground mt-3 text-xs">
                {formatWhen(order.createdAt)} ·{" "}
                <span className="font-mono">{order.id.slice(0, 8)}</span>
              </p>
            </article>
          ))}
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Manage catalog in{" "}
        <Link href="/dashboard/products" className="text-primary underline-offset-4 hover:underline">
          Products
        </Link>
        .
      </p>
    </div>
  )
}

function formatPhone(phone: string) {
  return `+${phone.replace("@c.us", "")}`
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="bg-muted text-muted-foreground mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium">
      {status.toLowerCase()}
    </span>
  )
}
