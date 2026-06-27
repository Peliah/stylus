import { prisma } from "@/lib/prisma"
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory"

export async function getDashboardStats(vendorId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    pendingSuggestions,
    customerCount,
    productCount,
    orderCount,
    revenue7d,
    orders7d,
    lowStockCount,
    recentSuggestions,
    recentOrders,
    ordersByDay,
  ] = await Promise.all([
    prisma.suggestion.count({ where: { vendorId, status: "PENDING" } }),
    prisma.customer.count({ where: { vendorId } }),
    prisma.product.count({ where: { vendorId } }),
    prisma.order.count({ where: { vendorId } }),
    prisma.order.aggregate({
      where: { vendorId, createdAt: { gte: sevenDaysAgo }, status: { not: "CANCELLED" } },
      _sum: { totalPrice: true },
    }),
    prisma.order.count({
      where: { vendorId, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.product.count({
      where: { vendorId, stock: { lte: LOW_STOCK_THRESHOLD } },
    }),
    prisma.suggestion.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        customerPhoneNumber: true,
        status: true,
        proposedReply: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.order.findMany({
      where: { vendorId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, totalPrice: true },
    }),
  ])

  const chartData = buildOrdersByDayChart(ordersByDay, sevenDaysAgo)

  return {
    pendingSuggestions,
    customerCount,
    productCount,
    orderCount,
    revenue7d: revenue7d._sum.totalPrice ?? 0,
    orders7d,
    lowStockCount,
    recentSuggestions,
    recentOrders,
    chartData,
  }
}

function buildOrdersByDayChart(
  orders: { createdAt: Date; totalPrice: number }[],
  since: Date
) {
  const days: { date: string; orders: number; revenue: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, orders: 0, revenue: 0 })
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10)
    const bucket = days.find((d) => d.date === key)
    if (bucket) {
      bucket.orders += 1
      bucket.revenue += order.totalPrice
    }
  }

  return days.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en", { weekday: "short" }),
  }))
}
