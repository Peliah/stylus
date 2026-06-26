"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@workspace/ui/components/button"
import { WhatsAppConnectCard } from "@/components/setup/whatsapp-connect-card"

type Step = "connect" | "shop" | "verify" | "catalog"

interface SetupStatus {
  setupId: string
  shopName: string | null
  connectedPhone: string | null
  gateway: {
    state: string
    phone: string | null
    connected: boolean
  }
}

export function GetStartedWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("connect")
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [shopName, setShopName] = useState("")
  const [code, setCode] = useState("")
  const [qr, setQr] = useState<string | null>(null)
  const [qrMessage, setQrMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [otpSent, setOtpSent] = useState(false)

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/setup/status", { cache: "no-store" })
    if (!res.ok) return null
    const data = (await res.json()) as SetupStatus
    setStatus(data)
    if (data.shopName) setShopName(data.shopName)
    return data
  }, [])

  const fetchQr = useCallback(async () => {
    const res = await fetch("/api/setup/qr", { method: "POST" })
    if (!res.ok) return
    const data = (await res.json()) as { qr: string | null; message?: string }
    setQr(data.qr)
    setQrMessage(data.message ?? null)
  }, [])

  useEffect(() => {
    startTransition(async () => {
      setError(null)
      await fetch("/api/setup/start", { method: "POST" })
      await refreshStatus()
      await fetchQr()
    })
  }, [refreshStatus, fetchQr])

  useEffect(() => {
    if (step !== "connect") return

    const interval = setInterval(async () => {
      const data = await refreshStatus()
      if (data?.gateway.connected) {
        setStep("shop")
      } else {
        await fetchQr()
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [step, refreshStatus, fetchQr])

  function handleShopSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await fetch("/api/setup/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Failed to save shop name")
        return
      }
      setStep("verify")
      const otpRes = await fetch("/api/setup/otp/send", { method: "POST" })
      const otpData = (await otpRes.json()) as { error?: string }
      if (!otpRes.ok) {
        setError(otpData.error ?? "Failed to send code")
        return
      }
      setOtpSent(true)
    })
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!status?.setupId) return

    startTransition(async () => {
      const result = await signIn("whatsapp-otp", {
        setupId: status.setupId,
        code,
        redirect: false,
        callbackUrl: "/onboarding",
      })

      if (result?.error) {
        setError("Invalid or expired code. Try again or request a new one.")
        return
      }

      router.replace("/onboarding")
    })
  }

  function handleResendOtp() {
    setError(null)
    startTransition(async () => {
      const res = await fetch("/api/setup/otp/send", { method: "POST" })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Failed to send code")
        return
      }
      setOtpSent(true)
    })
  }

  const displayPhone = status?.connectedPhone?.replace("@c.us", "") ?? status?.gateway.phone

  const stepLabels = ["Connect", "Shop", "Verify"]
  const stepIndex = step === "connect" ? 0 : step === "shop" ? 1 : 2

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Step {stepIndex + 1} of {stepLabels.length}
        </p>
        <h1 className="font-heading mt-2 text-2xl font-semibold tracking-tight">
          {step === "connect" && "Connect WhatsApp to Stylus"}
          {step === "shop" && "Confirm your shop"}
          {step === "verify" && "Verify it's you"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {step === "connect" && "Scan the code with the WhatsApp account you use for your business."}
          {step === "shop" && "We'll use this name when talking to customers."}
          {step === "verify" && "Enter the 6-digit code we sent to your WhatsApp."}
        </p>
      </div>

      <div className="flex gap-2">
        {stepLabels.map((_, i) => (
          <div
            key={i}
            className={
              i <= stepIndex ? "bg-primary h-1 flex-1 rounded-full" : "bg-muted h-1 flex-1 rounded-full"
            }
          />
        ))}
      </div>

      {error && (
        <p className="text-destructive border-destructive/30 bg-destructive/10 rounded-lg border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {step === "connect" && (
        <WhatsAppConnectCard
          qr={qr}
          connected={status?.gateway.connected ?? false}
          waitingMessage={qrMessage}
          connectedPhone={status?.connectedPhone}
        />
      )}

      {step === "shop" && (
        <form onSubmit={handleShopSubmit} className="flex flex-col gap-4">
          {displayPhone && (
            <p className="text-muted-foreground text-sm">
              Connected as <span className="text-foreground font-medium">+{displayPhone}</span>
            </p>
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground text-xs font-medium">Shop name</span>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              placeholder="Peliah Bakery"
              className="border-input bg-background h-10 rounded-lg border px-3"
            />
          </label>
          <Button type="submit" disabled={pending} className="rounded-full">
            Continue
          </Button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          {displayPhone && (
            <p className="text-muted-foreground text-sm">
              Code sent to <span className="text-foreground font-medium">+{displayPhone}</span>
              {otpSent ? "" : "…"}
            </p>
          )}
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
          <Button type="submit" disabled={pending || code.length !== 6} className="rounded-full">
            {pending ? "Verifying…" : "Create shop"}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={handleResendOtp}>
            Resend code
          </Button>
        </form>
      )}
    </div>
  )
}
