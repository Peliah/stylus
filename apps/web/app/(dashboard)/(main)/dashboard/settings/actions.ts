"use server"

import { revalidatePath } from "next/cache"
import { updateVendorShopName } from "@/lib/onboarding"
import { requireAuthVendorId } from "@/lib/session"

export async function updateShopNameAction(formData: FormData) {
  const vendorId = await requireAuthVendorId()
  const name = String(formData.get("name") ?? "").trim()
  await updateVendorShopName(vendorId, name)
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
}
