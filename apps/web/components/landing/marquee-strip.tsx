"use client"

import { useReducedMotion } from "motion/react"
import { cn } from "@workspace/ui/lib/utils"

const messages = [
  "do you still have sourdough?",
  "2 choc cookies pls",
  "how much is the espresso beans",
  "can i get same as last week",
  "is the red velvet still available",
  "pickup in 20 mins ok?",
  "send account number",
  "add one more cupcake",
]

function Track() {
  return (
    <>
      {messages.map((msg) => (
        <span
          key={msg}
          className="mx-5 inline-flex shrink-0 items-center gap-5 font-mono text-[13px] text-muted-foreground"
        >
          <span className="whitespace-nowrap">&ldquo;{msg}&rdquo;</span>
          <span className="text-border">/</span>
        </span>
      ))}
    </>
  )
}

export function MarqueeStrip() {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return (
      <section className="border-border/40 border-y px-6 py-3">
        <p className="text-muted-foreground text-center font-mono text-xs leading-relaxed">
          {messages.map((msg) => `“${msg}”`).join(" · ")}
        </p>
      </section>
    )
  }

  return (
    <section className="border-border/40 overflow-x-hidden border-y py-3">
      <div
        className={cn("flex w-max", !prefersReducedMotion && "animate-marquee")}
        aria-hidden={!prefersReducedMotion}
      >
        <Track />
        {!prefersReducedMotion && <Track />}
      </div>
    </section>
  )
}
