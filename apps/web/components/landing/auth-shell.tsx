import Link from "next/link"
import type { ReactNode } from "react"

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-24">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-10 font-mono text-xs transition-colors"
      >
        ← back to stylus
      </Link>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}
