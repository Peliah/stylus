"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@workspace/ui/components/button"
import { WhatsAppConnectCard } from "@/components/setup/whatsapp-connect-card"

type LoginStep = "phone" | "reconnect" | "code"

export function WhatsAppOtpForm() {
  const [step, setStep] = useState<LoginStep>("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [sentPhone, setSentPhone] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const fetchQr = useCallback(async (phoneNumber: string) => {
    const res = await fetch("/api/auth/whatsapp/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber }),
    })
    if (!res.ok) return
    const data = (await res.json()) as { qr: string | null }
    setQr(data.qr)
  }, [])

  const checkConnection = useCallback(async (phoneNumber: string) => {
    const res = await fetch("/api/auth/whatsapp/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { connected?: boolean }
    setConnected(data.connected ?? false)
    return data.connected ?? false
  }, [])

  const sendOtp = useCallback(async (phoneNumber: string) => {
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber, intent: "login" }),
    })
    const data = (await res.json()) as { error?: string; phone?: string; needsReconnect?: boolean }
    if (!res.ok) {
      if (data.needsReconnect) {
        setStep("reconnect")
        await fetch("/api/auth/whatsapp/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNumber }),
        })
        await fetchQr(phoneNumber)
        return false
      }
      setError(data.error ?? "Failed to send code")
      return false
    }
    setSentPhone(data.phone ?? phoneNumber)
    return true
  }, [fetchQr])

  useEffect(() => {
    if (step !== "reconnect" || !phone) return

    void fetchQr(phone)

    const interval = setInterval(async () => {
      const isConnected = await checkConnection(phone)
      if (isConnected) {
        setStep("code")
        await sendOtp(phone)
      } else {
        await fetchQr(phone)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [step, phone, fetchQr, checkConnection, sendOtp])

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const prep = await fetch("/api/auth/whatsapp/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const prepData = (await prep.json()) as { error?: string; connected?: boolean }
      if (!prep.ok) {
        setError(prepData.error ?? "Could not find your shop")
        return
      }

      if (prepData.connected) {
        const ok = await sendOtp(phone)
        if (ok) setStep("code")
      } else {
        setStep("reconnect")
        await fetchQr(phone)
      }
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
        intent: "login",
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
      <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
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
            We&apos;ll verify your shop and send a code to this WhatsApp.
          </span>
        </label>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="rounded-full">
          {loading ? "Checking…" : "Continue"}
        </Button>
      </form>
    )
  }

  if (step === "reconnect") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Reconnect WhatsApp to continue logging in.
        </p>
        <WhatsAppConnectCard qr={qr} connected={connected} />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="button" variant="ghost" className="rounded-full" onClick={() => setStep("phone")}>
          Change number
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Enter the 6-digit code we sent to your WhatsApp
        {sentPhone ? ` (+${sentPhone.replace("@c.us", "").replace(/\D/g, "")})` : ""}.
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
        <Button type="submit" disabled={loading || pending || code.length !== 6} className="rounded-full">
          {loading ? "Verifying…" : "Log in"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full"
          disabled={loading || pending}
          onClick={() => {
            setStep("phone")
            setCode("")
            setError(null)
          }}
        >
          Start over
        </Button>
      </div>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="self-start px-0"
        disabled={pending}
        onClick={() => startTransition(() => void sendOtp(sentPhone ?? phone))}
      >
        Resend code
      </Button>
    </form>
  )
}
