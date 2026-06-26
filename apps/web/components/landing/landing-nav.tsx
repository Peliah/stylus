"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "border-b border-border/50 bg-background/90 backdrop-blur-md" : ""
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-base font-semibold tracking-tight">
          Stylus
        </Link>

        <nav className="hidden items-center gap-6 font-mono text-xs text-muted-foreground md:flex">
          <a href="#story" className="hover:text-foreground transition-colors">
            the flow
          </a>
          <a href="#features" className="hover:text-foreground transition-colors">
            what you get
          </a>
        </nav>

        <Button size="sm" className="rounded-full" nativeButton={false} render={<Link href="/dashboard" />}>
          Dashboard
        </Button>
      </div>
    </header>
  )
}
