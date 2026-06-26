import Link from "next/link"
import { getOutboundPendingCount } from "@/lib/outbound-queue"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"
import { getVendorConnectionStatus } from "@/lib/whatsapp-connection"
import { WhatsAppReconnectPanel } from "@/components/setup/whatsapp-reconnect-panel"

export default async function DashboardPage() {
  const vendor = await getActiveVendor()
  const vendorId = vendor.id

  const [connection, outboundPending, pendingSuggestions, orderCount, productCount, customerCount] =
    await Promise.all([
      getVendorConnectionStatus(vendor),
      getOutboundPendingCount(),
      vendorId
        ? prisma.suggestion.count({ where: { vendorId, status: "PENDING" } })
        : Promise.resolve(0),
      prisma.order.count({ where: { vendorId } }),
      prisma.product.count({ where: { vendorId } }),
      prisma.customer.count({ where: { vendorId } }),
    ])

  const { gateway, connected } = connection

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
            <p className="text-sm font-medium">WhatsApp</p>
            <p className="mt-1 text-sm">
              {connected ? (
                <span className="text-emerald-600 dark:text-emerald-400">Connected</span>
              ) : gateway.state === "unreachable" ? (
                <span className="text-destructive">Unavailable — try again in a moment</span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300">Not connected</span>
              )}
            </p>
            {gateway.phone && (
              <p className="text-muted-foreground mt-1 text-xs">+{gateway.phone}</p>
            )}
          </div>
          {outboundPending > 0 && (
            <p className="rounded-md bg-background/80 px-2.5 py-1 text-xs font-medium">
              {outboundPending} message{outboundPending === 1 ? "" : "s"} queued
            </p>
          )}
        </div>
        {!connected && (
          <>
            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
              Outbound replies queue automatically and send when WhatsApp is connected again.
            </p>
            <WhatsAppReconnectPanel phone={vendor.phoneNumber.replace("@c.us", "")} />
          </>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending suggestions" value={pendingSuggestions} href="/dashboard/suggestions" />
        <StatCard label="Orders" value={orderCount} href="/dashboard/orders" />
        <StatCard label="Products" value={productCount} href="/dashboard/products" />
        <StatCard label="Customers" value={customerCount} href="/dashboard/orders" />
      </section>
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
