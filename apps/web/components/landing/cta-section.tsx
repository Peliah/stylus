"use client"

import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { FadeIn } from "./fade-in"

export function CtaSection() {
  return (
    <section className="pb-28 md:pb-36">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <FadeIn>
          <p className="font-mono text-xs text-muted-foreground">
            stylus bakery runs on this. yours can too.
          </p>
          <h2 className="font-heading mt-4 text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-tight">
            Set up your catalog.
            <br />
            Link WhatsApp.
            <br />
            <span className="text-muted-foreground font-normal">Answer fewer repeated questions.</span>
          </h2>
          <div className="mt-9">
            <Button size="lg" className="h-12 rounded-full px-8 text-base" nativeButton={false} render={<Link href="/dashboard" />}>
              Go to dashboard
            </Button>
          </div>
          <p className="text-muted-foreground/70 mt-6 text-xs">
            Docker, Postgres, Redis, OpenWA — the boring stuff is already wired.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
