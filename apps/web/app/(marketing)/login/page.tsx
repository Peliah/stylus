import Link from "next/link"
import { AuthShell } from "@/components/landing/auth-shell"
import { WhatsAppOtpForm } from "@/components/auth/whatsapp-otp-form"

export const metadata = {
  title: "Log in — Stylus",
  description: "Log in to your Stylus vendor dashboard with WhatsApp verification.",
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Log in"
      description="We'll send a one-time code to your WhatsApp — your second factor to access the dashboard."
    >
      <div className="border-border/60 bg-muted/20 rounded-xl border px-5 py-6">
        <WhatsAppOtpForm intent="login" />
        <p className="text-muted-foreground mt-6 text-center text-xs">
          New here?{" "}
          <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
            Create a shop
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
