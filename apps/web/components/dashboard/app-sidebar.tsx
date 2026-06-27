"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiMagicIcon,
  Chatting01Icon,
  DashboardSquare01Icon,
  Logout01Icon,
  PackageIcon,
  Settings01Icon,
  ShoppingCart01Icon,
  TerminalIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: DashboardSquare01Icon },
  { href: "/dashboard/suggestions", label: "Suggestions", icon: AiMagicIcon, badgeKey: "suggestions" as const },
  { href: "/dashboard/conversations", label: "Conversations", icon: Chatting01Icon },
  { href: "/dashboard/customers", label: "Customers", icon: UserMultipleIcon },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart01Icon },
  { href: "/dashboard/products", label: "Products", icon: PackageIcon, badgeKey: "lowStock" as const },
  { href: "/dashboard/commands", label: "Commands", icon: TerminalIcon },
  { href: "/dashboard/settings", label: "Settings", icon: Settings01Icon },
]

export function AppSidebar({
  vendorName,
  pendingSuggestions = 0,
  lowStockCount = 0,
}: {
  vendorName?: string
  pendingSuggestions?: number
  lowStockCount?: number
}) {
  const pathname = usePathname()

  const badges = {
    suggestions: pendingSuggestions,
    lowStock: lowStockCount,
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-sidebar-border border-b">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
          <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-semibold">
            S
          </span>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-heading text-sm font-semibold">Stylus</span>
            {vendorName && (
              <span className="text-muted-foreground truncate text-xs">{vendorName}</span>
            )}
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                      tooltip={item.label}
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {badgeCount > 0 && (
                      <SidebarMenuBadge>{badgeCount > 99 ? "99+" : badgeCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} data-icon="inline-start" />
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
