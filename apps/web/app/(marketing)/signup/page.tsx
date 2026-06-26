import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { AuthShell } from "@/components/landing/auth-shell"

export const metadata = {
  title: "Sign up — Stylus",
  description: "Create your shop and connect WhatsApp.",
}

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your shop"
      description="Sign up, connect your WhatsApp number, add your products. Stylus handles the drafts — you keep the send button."
    >
      <div className="border-border/60 bg-muted/20 rounded-xl border px-5 py-6">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Self-service signup is on the way. For now, use the dashboard to explore the product
          while we wire up accounts and onboarding.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="rounded-full" nativeButton={false} render={<Link href="/dashboard" />}>
            Open dashboard
          </Button>
          <Button variant="ghost" className="rounded-full" nativeButton={false} render={<Link href="/login" />}>
            Already have an account
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
