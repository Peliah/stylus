"use client"

import { motion, useReducedMotion } from "motion/react"
import { CheckCheck } from "lucide-react"

const messages = [
  {
    from: "customer",
    name: "Tola",
    text: "abeg 2 choc cookies + red velvet cupcake. pickup by 4?",
    time: "2:14 pm",
  },
  {
    from: "vendor-ping",
    text: "Draft ready — 2× Dark Chocolate Cookie ($7) + Red Velvet Cupcake ($4). Total $11.\n\nReply 1 to send · 2 action only · 3 reject · edit [text]",
    time: "2:14 pm",
    label: "to you",
  },
  {
    from: "vendor",
    text: "1",
    time: "2:15 pm",
    label: "you",
  },
  {
    from: "outbound",
    text: "Got you, Tola — $11 total. Pickup by 4 works. See you then ✓",
    time: "2:15 pm",
    label: "sent",
  },
]

export function WhatsAppMockup() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className="relative mx-auto w-full max-w-sm lg:max-w-[340px]"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <div className="border-border bg-card relative min-w-0 rounded-xl border shadow-lg">
        <div className="border-border/60 flex items-center gap-3 border-b px-4 py-3">
          <div className="bg-[#25D366]/15 flex size-9 items-center justify-center rounded-full text-xs font-bold text-[#128C7E]">
            SB
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Stylus Bakery</p>
            <p className="text-muted-foreground text-xs">business account</p>
          </div>
        </div>

        <div className="space-y-2.5 bg-[#e5ddd5]/30 p-3 dark:bg-muted/20">
          {messages.map((msg, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {msg.label && (
                <span className="text-muted-foreground pe-1 text-[9px] font-medium uppercase tracking-wider ms-auto">
                  {msg.label}
                </span>
              )}
              <div
                className={
                  msg.from === "customer"
                    ? "bg-background max-w-[85%] self-start rounded-lg rounded-tl-none px-2.5 py-1.5 text-[13px] leading-snug shadow-sm"
                    : msg.from === "vendor-ping"
                      ? "border-primary/30 bg-primary/5 max-w-[95%] self-end rounded-lg rounded-tr-none border border-dashed px-2.5 py-2 text-[12px] leading-snug break-words whitespace-pre-line"
                      : msg.from === "vendor"
                        ? "bg-primary/90 text-primary-foreground max-w-[40px] self-end rounded-lg px-2.5 py-1.5 text-center text-sm font-medium"
                        : "bg-[#dcf8c6] text-[#111] max-w-[90%] self-end rounded-lg rounded-tr-none px-2.5 py-1.5 text-[13px] leading-snug dark:bg-primary dark:text-primary-foreground"
                }
              >
                {msg.from === "customer" && (
                  <span className="text-[#128C7E] mb-0.5 block text-[10px] font-semibold">
                    {msg.name}
                  </span>
                )}
                {msg.text}
              </div>
              <div
                className={`flex items-center gap-1 text-[9px] text-muted-foreground ${msg.from === "customer" ? "ps-1" : "ms-auto pe-1"}`}
              >
                <span>{msg.time}</span>
                {msg.from === "outbound" && <CheckCheck className="size-2.5 text-[#53bdeb]" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
