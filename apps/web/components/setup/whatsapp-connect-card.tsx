"use client"

import { CheckCircle2, Loader2 } from "lucide-react"

type WhatsAppConnectCardProps = {
  qr: string | null
  connected: boolean
  waitingMessage?: string | null
  connectedPhone?: string | null
}

export function WhatsAppConnectCard({
  qr,
  connected,
  waitingMessage,
  connectedPhone,
}: WhatsAppConnectCardProps) {
  return (
    <div className="border-border bg-card rounded-xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
          S
        </span>
        <div>
          <p className="font-heading text-sm font-semibold">Connect to Stylus</p>
          <p className="text-muted-foreground text-xs">Link your WhatsApp to manage orders</p>
        </div>
      </div>

      {connected ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle2 className="size-12 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium">WhatsApp connected</p>
          {connectedPhone && (
            <p className="text-muted-foreground text-xs">+{connectedPhone.replace("@c.us", "")}</p>
          )}
        </div>
      ) : qr ? (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-3 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="WhatsApp QR code" className="size-52" />
          </div>
          <div className="text-muted-foreground text-center text-xs leading-relaxed">
            <p>On your phone: WhatsApp → Linked devices</p>
            <p>→ Link a device → scan this code</p>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Loader2 className="size-3 animate-spin" />
            Waiting for scan…
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            {waitingMessage ?? "Preparing QR code…"}
          </p>
        </div>
      )}
    </div>
  )
}
