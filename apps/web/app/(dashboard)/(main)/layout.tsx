import { Sidebar } from "@/components/sidebar"
import { GatewayStatusBanner } from "@/components/gateway-status-banner"

export default function MainDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <GatewayStatusBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
