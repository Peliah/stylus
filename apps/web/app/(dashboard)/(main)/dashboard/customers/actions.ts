"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"

export async function updateCustomerAction(customerId: string, formData: FormData) {
  const vendor = await getActiveVendor()
  const name = String(formData.get("name") ?? "").trim() || null
  const notes = String(formData.get("notes") ?? "").trim() || null
  const loyaltyClass = String(formData.get("loyaltyClass") ?? "Regular").trim() || "Regular"

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, vendorId: vendor.id },
  })
  if (!customer) throw new Error("Customer not found")

  await prisma.customer.update({
    where: { id: customerId },
    data: { name, notes, loyaltyClass },
  })

  revalidatePath("/dashboard/customers")
  revalidatePath(`/dashboard/customers/${customerId}`)
}
