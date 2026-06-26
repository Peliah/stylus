"use server"

import { revalidatePath } from "next/cache"
import { requireAuthVendorId } from "@/lib/session"
import {
  completeOnboarding,
  linkVendorWhatsApp,
  updateVendorShopName,
} from "@/lib/onboarding"
import {
  ensureOpenwaSession,
  registerWebhookForSession,
  startOpenwaSession,
} from "@/lib/openwa-session"
import { prisma } from "@/lib/prisma"
import { createProductAction } from "@/app/(dashboard)/(main)/dashboard/products/actions"

export async function updateShopNameAction(name: string) {
  const vendorId = await requireAuthVendorId()
  await updateVendorShopName(vendorId, name)
  revalidatePath("/onboarding")
}

export async function prepareWhatsAppAction() {
  const vendorId = await requireAuthVendorId()
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } })
  const sessionName = `stylus-vendor-${vendor.id}`
  const sessionId = await ensureOpenwaSession(vendor.openwaSessionId, sessionName)
  await startOpenwaSession(sessionId)

  if (vendor.openwaSessionId !== sessionId) {
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { openwaSessionId: sessionId },
    })
  }

  const webhookUrl = process.env.WEBHOOK_URL
  const webhookSecret = process.env.WEBHOOK_SECRET
  if (webhookUrl) {
    await registerWebhookForSession(sessionId, webhookUrl, webhookSecret)
  }

  revalidatePath("/onboarding")
  return { sessionId }
}

export async function linkWhatsAppAction() {
  const vendorId = await requireAuthVendorId()
  await linkVendorWhatsApp(vendorId)
  revalidatePath("/onboarding")
}

export async function finishOnboardingAction() {
  const vendorId = await requireAuthVendorId()
  await completeOnboarding(vendorId)
  revalidatePath("/onboarding")
  revalidatePath("/dashboard")
}

export async function addFirstProductAction(formData: FormData) {
  await createProductAction(formData)
  revalidatePath("/onboarding")
}

export { createProductAction as addCatalogProductAction }
