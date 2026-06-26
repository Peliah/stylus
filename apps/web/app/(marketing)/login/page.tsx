import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { AuthShell } from "@/components/landing/auth-shell"

export const metadata = {
  title: "Log in — Stylus",
  description: "Log in to your Stylus vendor dashboard.",
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Log in"
      description="Access your orders, catalog, and pending AI suggestions."
    >
      <div className="border-border/60 bg-muted/20 rounded-xl border px-5 py-6">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Vendor login lands in Phase D. Until then, the dashboard is open for preview.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="rounded-full" nativeButton={false} render={<Link href="/dashboard" />}>
            Continue to dashboard
          </Button>
          <Button variant="ghost" className="rounded-full" nativeButton={false} render={<Link href="/signup" />}>
            Create a shop
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
