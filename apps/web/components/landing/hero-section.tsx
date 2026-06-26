"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { Button } from "@workspace/ui/components/button"
import { WhatsAppMockup } from "./whatsapp-mockup"

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="relative mx-auto grid max-w-6xl items-start gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="max-w-xl pt-2">
          <motion.p
            className="text-muted-foreground mb-6 font-mono text-xs"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            for the vendor who answers WhatsApp between batches
          </motion.p>

          <h1 className="font-heading text-[2.1rem] leading-[1.12] font-semibold tracking-tight sm:text-[2.75rem] lg:text-[3.1rem]">
            <motion.span
              className="block"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              They order in chat.
            </motion.span>
            <motion.span
              className="text-muted-foreground mt-1 block font-normal"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              You shouldn&apos;t have to type the same reply{" "}
              <span className="text-foreground decoration-primary/40 underline decoration-wavy underline-offset-4">
                forty times
              </span>{" "}
              a week.
            </motion.span>
          </h1>

          <motion.p
            className="text-muted-foreground mt-7 max-w-md text-[15px] leading-[1.7] sm:text-base"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            Stylus watches your WhatsApp, checks what you actually have in stock, drafts
            the reply — then pings <em>you</em> to hit send. Nothing goes to the customer
            until you&apos;re happy with it.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <Button size="lg" className="h-11 rounded-full px-6" nativeButton={false} render={<Link href="/dashboard" />}>
              Open the dashboard
            </Button>
            <Button variant="ghost" size="lg" className="h-11 text-muted-foreground" nativeButton={false} render={<a href="#story" />}>
              Read how a order actually flows →
            </Button>
          </motion.div>

          <motion.div
            className="border-border/50 mt-10 border-s-2 border-primary/50 ps-4"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              <span className="text-foreground">1</span> approve &nbsp;·&nbsp;
              <span className="text-foreground">2</span> action only &nbsp;·&nbsp;
              <span className="text-foreground">3</span> reject &nbsp;·&nbsp;
              <span className="text-foreground">edit …</span> your words
            </p>
            <p className="text-muted-foreground/80 mt-1 text-xs">vendor replies from your own phone</p>
          </motion.div>
        </div>

        <div className="relative overflow-hidden lg:pt-6">
          <div className="border-border/60 bg-card/80 absolute start-0 top-0 z-10 max-w-[200px] rotate-[-4deg] rounded-lg border px-3 py-2 shadow-sm md:-start-4">
            <p className="font-mono text-[10px] leading-snug text-muted-foreground">
              tuesday 2:14pm
              <br />
              <span className="text-foreground">sourdough: 15 left</span>
            </p>
          </div>
          <WhatsAppMockup />
        </div>
      </div>
    </section>
  )
}
