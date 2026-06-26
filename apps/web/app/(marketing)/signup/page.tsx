import Link from "next/link"
import { AuthShell } from "@/components/landing/auth-shell"
import { WhatsAppOtpForm } from "@/components/auth/whatsapp-otp-form"

export const metadata = {
  title: "Sign up — Stylus",
  description: "Create your shop and verify your WhatsApp number.",
}

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your shop"
      description="Sign up with your WhatsApp number. We verify ownership by sending you a one-time code."
    >
      <div className="border-border/60 bg-muted/20 rounded-xl border px-5 py-6">
        <WhatsAppOtpForm intent="signup" />
        <p className="text-muted-foreground mt-6 text-center text-xs">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
