"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@workspace/ui/components/button"

type WhatsAppOtpFormProps = {
  intent: "login" | "signup"
}

export function WhatsAppOtpForm({ intent }: WhatsAppOtpFormProps) {
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [phone, setPhone] = useState("")
  const [shopName, setShopName] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sentPhone, setSentPhone] = useState<string | null>(null)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, intent }),
      })
      const data = (await res.json()) as { error?: string; phone?: string }
      if (!res.ok) {
        setError(data.error ?? "Failed to send code")
        return
      }
      setSentPhone(data.phone ?? phone)
      setStep("code")
    } catch {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn("whatsapp-otp", {
        phone: sentPhone ?? phone,
        code,
        intent,
        shopName: intent === "signup" ? shopName : undefined,
        redirect: false,
        callbackUrl: "/dashboard",
      })

      if (result?.error) {
        setError("Invalid or expired code. Try again or request a new one.")
        return
      }

      window.location.href = "/dashboard"
    } catch {
      setError("Verification failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (step === "phone") {
    return (
      <form onSubmit={handleSendCode} className="flex flex-col gap-4">
        {intent === "signup" && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground text-xs font-medium">Shop name</span>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Peliah Bakery"
              required
              className="border-input bg-background h-10 rounded-lg border px-3"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground text-xs font-medium">WhatsApp number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+237 6 50 81 09 84"
            required
            type="tel"
            autoComplete="tel"
            className="border-input bg-background h-10 rounded-lg border px-3"
          />
          <span className="text-muted-foreground text-xs">
            We&apos;ll send a 6-digit code to this number on WhatsApp.
          </span>
        </label>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="rounded-full">
          {loading ? "Sending…" : "Send code to WhatsApp"}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Enter the 6-digit code we sent to your WhatsApp
        {sentPhone ? ` (+${sentPhone.replace("@c.us", "")})` : ""}.
      </p>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground text-xs font-medium">Verification code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          className="border-input bg-background h-10 rounded-lg border px-3 font-mono tracking-widest"
        />
      </label>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={loading || code.length !== 6} className="rounded-full">
          {loading ? "Verifying…" : "Verify & continue"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full"
          disabled={loading}
          onClick={() => {
            setStep("phone")
            setCode("")
            setError(null)
          }}
        >
          Change number
        </Button>
      </div>
    </form>
  )
}
