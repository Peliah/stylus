"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  addFirstProductAction,
  finishOnboardingAction,
  linkWhatsAppAction,
  prepareWhatsAppAction,
  updateShopNameAction,
} from "@/app/(dashboard)/onboarding/actions"

type ViewStep = "welcome" | "whatsapp" | "catalog"

interface OnboardingStatus {
  vendor: {
    name: string
    phoneNumber: string
    onboardingComplete: boolean
    whatsappLinkedAt: string | null
    productCount: number
  }
  step: "whatsapp" | "catalog" | "complete"
  gateway: {
    state: "connected" | "disconnected" | "unreachable"
    rawStatus: string
    phone: string | null
    pushName: string | null
    lastError: string | null
  }
  phoneMatches: boolean
  sessionId: string
}

const STEPS = [
  { id: "welcome", label: "Shop" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "catalog", label: "Catalog" },
] as const

export function OnboardingWizard({ initial }: { initial: OnboardingStatus }) {
  const router = useRouter()
  const [status, setStatus] = useState(initial)
  const [viewStep, setViewStep] = useState<ViewStep>(() =>
    initial.vendor.whatsappLinkedAt ? "catalog" : "welcome"
  )
  const [shopName, setShopName] = useState(initial.vendor.name)
  const [qr, setQr] = useState<string | null>(null)
  const [qrMessage, setQrMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const stepIndex = STEPS.findIndex((s) => s.id === (viewStep === "welcome" ? "welcome" : viewStep))

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/onboarding/status", { cache: "no-store" })
    if (!res.ok) return
    const data = (await res.json()) as OnboardingStatus
    setStatus(data)
    if (data.vendor.whatsappLinkedAt && viewStep === "whatsapp") {
      setViewStep("catalog")
    }
    if (data.vendor.onboardingComplete) {
      router.replace("/dashboard")
    }
  }, [router, viewStep])

  const fetchQr = useCallback(async () => {
    const res = await fetch("/api/onboarding/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "qr" }),
    })
    if (!res.ok) return
    const data = (await res.json()) as { qr: string | null; message?: string; status: string }
    setQr(data.qr)
    setQrMessage(data.message ?? null)
  }, [])

  useEffect(() => {
    if (viewStep !== "whatsapp") return

    void prepareWhatsAppAction().catch(() => undefined)
    void fetchQr()

    const interval = setInterval(() => {
      void refreshStatus()
      if (status.gateway.state !== "connected") {
        void fetchQr()
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [viewStep, fetchQr, refreshStatus, status.gateway.state])

  function handleWelcome(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await updateShopNameAction(shopName)
        setViewStep("whatsapp")
        await refreshStatus()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save shop name")
      }
    })
  }

  function handleLinkWhatsApp() {
    setError(null)
    startTransition(async () => {
      try {
        await linkWhatsAppAction()
        await refreshStatus()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to link WhatsApp")
      }
    })
  }

  function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await addFirstProductAction(formData)
        e.currentTarget.reset()
        await refreshStatus()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add product")
      }
    })
  }

  function handleFinish() {
    setError(null)
    startTransition(async () => {
      try {
        await finishOnboardingAction()
        router.replace("/dashboard")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to finish setup")
      }
    })
  }

  const displayPhone = status.vendor.phoneNumber.replace("@c.us", "")

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <h1 className="font-heading mt-2 text-2xl font-semibold tracking-tight">
          {viewStep === "welcome" && "Name your shop"}
          {viewStep === "whatsapp" && "Connect WhatsApp"}
          {viewStep === "catalog" && "Add your first product"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {viewStep === "welcome" && "This is how customers and Stylus will refer to your business."}
          {viewStep === "whatsapp" &&
            `Scan the QR code with the WhatsApp account for +${displayPhone}.`}
          {viewStep === "catalog" &&
            "The AI uses your catalog when drafting replies and creating orders."}
        </p>
      </div>

      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={
              i <= stepIndex
                ? "bg-primary h-1 flex-1 rounded-full"
                : "bg-muted h-1 flex-1 rounded-full"
            }
          />
        ))}
      </div>

      {error && (
        <p className="text-destructive border-destructive/30 bg-destructive/10 rounded-lg border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {viewStep === "welcome" && (
        <form onSubmit={handleWelcome} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground text-xs font-medium">Shop name</span>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              className="border-input bg-background h-10 rounded-lg border px-3"
            />
          </label>
          <p className="text-muted-foreground text-xs">
            Verified phone: +{displayPhone}
          </p>
          <Button type="submit" disabled={pending} className="rounded-full">
            Continue
          </Button>
        </form>
      )}

      {viewStep === "whatsapp" && (
        <div className="flex flex-col gap-4">
          <div className="border-border bg-card rounded-xl border p-4">
            <p className="text-sm font-medium">Connection status</p>
            <p className="mt-1 text-sm">
              {status.gateway.state === "connected" ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Connected ({status.gateway.rawStatus})
                  {status.gateway.phone ? ` · +${status.gateway.phone}` : ""}
                </span>
              ) : status.gateway.state === "unreachable" ? (
                <span className="text-destructive">Gateway unreachable — is Docker running?</span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300">
                  Waiting for scan ({status.gateway.rawStatus})
                </span>
              )}
            </p>
            {status.gateway.lastError && status.gateway.state !== "connected" && (
              <p className="text-muted-foreground mt-2 text-xs">{status.gateway.lastError}</p>
            )}
          </div>

          {qr ? (
            <div className="border-border flex flex-col items-center gap-3 rounded-xl border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="WhatsApp QR code" className="size-56" />
              <p className="text-muted-foreground text-center text-xs">
                Open WhatsApp → Linked devices → Link a device
              </p>
            </div>
          ) : status.gateway.state !== "connected" ? (
            <p className="text-muted-foreground text-sm">
              {qrMessage ?? "Loading QR code…"}
            </p>
          ) : null}

          {status.gateway.state === "connected" && (
            <Button
              type="button"
              disabled={pending}
              onClick={handleLinkWhatsApp}
              className="rounded-full"
            >
              {status.phoneMatches ? "Confirm & continue" : "Verify connection"}
            </Button>
          )}

          <p className="text-muted-foreground text-xs leading-relaxed">
            OpenWA dashboard:{" "}
            <a
              href="http://localhost:2785"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              localhost:2785
            </a>
          </p>
        </div>
      )}

      {viewStep === "catalog" && (
        <div className="flex flex-col gap-4">
          {status.vendor.productCount > 0 ? (
            <p className="text-muted-foreground text-sm">
              You have {status.vendor.productCount} product
              {status.vendor.productCount === 1 ? "" : "s"} in your catalog.
            </p>
          ) : (
            <form onSubmit={handleAddProduct} className="border-border bg-card grid gap-3 rounded-xl border p-4">
              <Field label="Name" name="name" required placeholder="Dark Chocolate Cookie" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Price" name="price" type="number" step="0.01" min="0" required placeholder="3.50" />
                <Field label="Stock" name="stock" type="number" min="0" required placeholder="50" />
              </div>
              <Field label="SKU (optional)" name="sku" placeholder="COOKIE-01" />
              <Button type="submit" disabled={pending} size="sm">
                Add product
              </Button>
            </form>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={pending}
              onClick={handleFinish}
              className="rounded-full"
            >
              {status.vendor.productCount > 0 ? "Go to dashboard" : "Skip for now"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  ...props
}: {
  label: string
  name: string
  type?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <input
        name={name}
        type={type}
        className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
        {...props}
      />
    </label>
  )
}
