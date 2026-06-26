import { LandingNav } from "@/components/landing/landing-nav"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-svh overflow-x-clip">
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
    </div>
  )
}
