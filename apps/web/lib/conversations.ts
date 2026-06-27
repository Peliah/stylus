import { prisma } from "@/lib/prisma"

export async function listConversationCustomers(vendorId: string, limit = 50) {
  const customers = await prisma.customer.findMany({
    where: { vendorId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      messages: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
      _count: { select: { messages: true, orders: true } },
    },
  })

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumber: c.phoneNumber,
    lastMessage: c.messages[0] ?? null,
    messageCount: c._count.messages,
    orderCount: c._count.orders,
  }))
}

export async function getConversationThread(customerId: string, vendorId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, vendorId },
    include: {
      messages: { orderBy: { timestamp: "asc" } },
    },
  })

  return customer
}
