import { redirect } from "next/navigation"
import { getActiveVendor } from "@/lib/vendor"

export default async function DashboardGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const vendor = await getActiveVendor()
  if (!vendor.onboardingComplete) {
    redirect("/onboarding")
  }

  return children
}
