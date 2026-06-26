"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, WifiOff } from "lucide-react"

interface HealthResponse {
  gateway: {
    state: "connected" | "disconnected" | "unreachable"
    connected: boolean
  }
  outbound: {
    pending: number
  }
}

export function GatewayStatusBanner() {
  const [health, setHealth] = useState<HealthResponse | null>(null)

  useEffect(() => {
    let active = true

    async function fetchHealth() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as HealthResponse
        if (active) setHealth(data)
      } catch {
        if (active) {
          setHealth({
            gateway: {
              state: "unreachable",
              connected: false,
            },
            outbound: { pending: 0 },
          })
        }
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, 30_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  if (!health || health.gateway.connected) {
    return null
  }

  const { gateway, outbound } = health
  const isUnreachable = gateway.state === "unreachable"

  return (
    <div
      role="status"
      className={
        isUnreachable
          ? "border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 border-b px-4 py-3 text-sm"
          : "flex items-start gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
      }
    >
      {isUnreachable ? (
        <WifiOff className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="space-y-0.5">
        <p className="font-medium">
          {isUnreachable
            ? "We couldn't reach WhatsApp right now"
            : "WhatsApp disconnected"}
        </p>
        <p className="opacity-90">
          {outbound.pending > 0
            ? `${outbound.pending} message${outbound.pending === 1 ? "" : "s"} queued — will send when you're connected again.`
            : "Reconnect WhatsApp to send and receive messages."}
        </p>
      </div>
    </div>
  )
}
