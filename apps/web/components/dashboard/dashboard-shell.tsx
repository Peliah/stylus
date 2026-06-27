"use client"

import type { ReactNode } from "react"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { GatewayStatusBanner } from "@/components/gateway-status-banner"
import { AppSidebar } from "@/components/dashboard/app-sidebar"

export function DashboardShell({
  children,
  vendorName,
  pendingSuggestions,
  lowStockCount,
}: {
  children: ReactNode
  vendorName?: string
  pendingSuggestions?: number
  lowStockCount?: number
}) {
  return (
    <SidebarProvider>
      <AppSidebar
        vendorName={vendorName}
        pendingSuggestions={pendingSuggestions}
        lowStockCount={lowStockCount}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground text-sm">Dashboard</span>
        </header>
        <GatewayStatusBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
