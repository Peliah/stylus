import { redirect } from "next/navigation"
import { CatalogOnboardingWizard } from "@/components/onboarding/catalog-onboarding-wizard"
import { getActiveVendor } from "@/lib/vendor"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: "Setup — Stylus",
  description: "Add products to your shop catalog.",
}

export default async function OnboardingPage() {
  const vendor = await getActiveVendor()

  if (vendor.onboardingComplete) {
    redirect("/dashboard")
  }

  if (!vendor.whatsappLinkedAt) {
    redirect("/get-started")
  }

  const productCount = await prisma.product.count({ where: { vendorId: vendor.id } })

  return (
    <CatalogOnboardingWizard productCount={productCount} shopName={vendor.name} />
  )
}
