"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/suggestions", label: "Suggestions" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Orders" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground hidden w-56 shrink-0 flex-col border-r md:flex">
      <div className="border-sidebar-border flex h-16 items-center gap-2 border-b px-4">
        <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-semibold">
          S
        </span>
        <Link href="/" className="font-heading text-sm font-semibold">
          Stylus
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === link.href
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
