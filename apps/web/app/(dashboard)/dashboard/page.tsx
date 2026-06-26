import Link from "next/link"
import { getGatewaySnapshot } from "@/lib/openwa-client"
import { getOutboundPendingCount } from "@/lib/outbound-queue"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const vendor = await prisma.vendor.findFirst({
    orderBy: { createdAt: "asc" },
  })

  const vendorId = vendor?.id

  const [gateway, outboundPending, pendingSuggestions, orderCount, productCount, customerCount] =
    await Promise.all([
      getGatewaySnapshot(),
      getOutboundPendingCount(),
      vendorId
        ? prisma.suggestion.count({ where: { vendorId, status: "PENDING" } })
        : Promise.resolve(0),
      vendorId ? prisma.order.count({ where: { vendorId } }) : Promise.resolve(0),
      vendorId ? prisma.product.count({ where: { vendorId } }) : Promise.resolve(0),
      vendorId ? prisma.customer.count({ where: { vendorId } }) : Promise.resolve(0),
    ])

  const connected = gateway.state === "connected"

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {vendor?.name ?? "Your store"} — WhatsApp CRM
        </p>
      </div>

      <section
        className={
          connected
            ? "border-border bg-card rounded-xl border p-4"
            : "rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">WhatsApp connection</p>
            <p className="mt-1 text-sm">
              {connected ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Connected ({gateway.rawStatus})
                </span>
              ) : gateway.state === "unreachable" ? (
                <span className="text-destructive">Gateway unreachable</span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300">
                  Disconnected ({gateway.rawStatus})
                </span>
              )}
            </p>
            {gateway.phone && (
              <p className="text-muted-foreground mt-1 text-xs">+{gateway.phone}</p>
            )}
            {gateway.lastError && !connected && (
              <p className="text-muted-foreground mt-1 text-xs">{gateway.lastError}</p>
            )}
          </div>
          {outboundPending > 0 && (
            <p className="rounded-md bg-background/80 px-2.5 py-1 text-xs font-medium">
              {outboundPending} message{outboundPending === 1 ? "" : "s"} queued
            </p>
          )}
        </div>
        {!connected && (
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            Outbound replies queue automatically and send when OpenWA reconnects. Scan QR at{" "}
            <a
              href="http://localhost:2785"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              localhost:2785
            </a>
            .
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending suggestions" value={pendingSuggestions} href="/dashboard/suggestions" />
        <StatCard label="Orders" value={orderCount} href="/dashboard/orders" />
        <StatCard label="Products" value={productCount} href="/dashboard/products" />
        <StatCard label="Customers" value={customerCount} href="/dashboard" />
      </section>

      <p className="text-muted-foreground text-xs">
        Full inbox, catalog, and order views are coming in the next dashboard phase. Suggestions
        inbox is next on the roadmap.
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string
  value: number
  href: string
}) {
  return (
    <Link
      href={href}
      className="border-border bg-card hover:bg-accent/40 rounded-xl border p-4 transition-colors"
    >
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </Link>
  )
}
