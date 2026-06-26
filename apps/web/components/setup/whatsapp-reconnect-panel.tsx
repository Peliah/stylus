"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { WhatsAppConnectCard } from "@/components/setup/whatsapp-connect-card"

interface WhatsAppReconnectPanelProps {
  phone: string
}

export function WhatsAppReconnectPanel({ phone }: WhatsAppReconnectPanelProps) {
  const [open, setOpen] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const fetchQr = useCallback(async () => {
    const res = await fetch("/api/auth/whatsapp/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    })
    if (!res.ok) return
    const data = (await res.json()) as { qr: string | null }
    setQr(data.qr)
  }, [phone])

  const checkStatus = useCallback(async () => {
    const res = await fetch("/api/auth/whatsapp/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { connected?: boolean }
    setConnected(data.connected ?? false)
    return data.connected ?? false
  }, [phone])

  useEffect(() => {
    if (!open) return

    void fetch("/api/auth/whatsapp/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    })
    void fetchQr()

    const interval = setInterval(async () => {
      const ok = await checkStatus()
      if (ok) {
        setOpen(false)
        window.location.reload()
      } else {
        await fetchQr()
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [open, phone, fetchQr, checkStatus])

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" className="mt-3 rounded-full" onClick={() => setOpen(true)}>
        Reconnect WhatsApp
      </Button>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      <WhatsAppConnectCard qr={qr} connected={connected} />
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  )
}
