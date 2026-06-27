"use server"

import { revalidatePath } from "next/cache"
import type { OrderStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: [],
  CANCELLED: [],
}

export async function updateOrderStatusAction(orderId: string, formData: FormData) {
  const vendor = await getActiveVendor()
  const status = String(formData.get("status") ?? "") as OrderStatus

  const order = await prisma.order.findFirst({
    where: { id: orderId, vendorId: vendor.id },
  })
  if (!order) throw new Error("Order not found")

  const allowed = ALLOWED_TRANSITIONS[order.status]
  if (!allowed.includes(status)) {
    throw new Error(`Cannot change status from ${order.status} to ${status}`)
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  revalidatePath("/dashboard/orders")
  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath("/dashboard")
}
