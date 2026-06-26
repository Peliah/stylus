import { redirect } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { getOnboardingStatus } from "@/lib/onboarding"
import { getActiveVendor } from "@/lib/vendor"

export const metadata = {
  title: "Setup — Stylus",
  description: "Connect WhatsApp and set up your shop.",
}

export default async function OnboardingPage() {
  const vendor = await getActiveVendor()
  if (vendor.onboardingComplete) {
    redirect("/dashboard")
  }

  const status = await getOnboardingStatus(vendor.id)

  return <OnboardingWizard initial={JSON.parse(JSON.stringify(status))} />
}
