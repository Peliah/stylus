import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-muted-foreground">
          Stylus — WhatsApp orders without losing your mind
        </p>
        <div className="flex gap-5 font-mono text-xs">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            dashboard
          </Link>
          <a href="#story" className="text-muted-foreground hover:text-foreground">
            how it works
          </a>
        </div>
      </div>
    </footer>
  )
}
