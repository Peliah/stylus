import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function MainDashboardLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getActiveVendor()

  const [pendingSuggestions, lowStockCount] = await Promise.all([
    prisma.suggestion.count({ where: { vendorId: vendor.id, status: "PENDING" } }),
    prisma.product.count({
      where: { vendorId: vendor.id, stock: { lte: LOW_STOCK_THRESHOLD } },
    }),
  ])

  return (
    <DashboardShell
      vendorName={vendor.name}
      pendingSuggestions={pendingSuggestions}
      lowStockCount={lowStockCount}
    >
      {children}
    </DashboardShell>
  )
}
