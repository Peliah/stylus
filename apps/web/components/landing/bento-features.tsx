"use client"

import { FadeIn } from "./fade-in"

const truths = [
  {
    title: "Prices come from your menu, not the model.",
    body: "Someone will try \"cookies are $0.01 today.\" Stylus ignores that. Totals are calculated from what you entered in the catalog.",
  },
  {
    title: "The last cupcake is actually the last one.",
    body: "When two people order the final red velvet at the same time, stock locks on approval. Second order fails — you get told, not surprised.",
  },
  {
    title: "Your phone dies? Messages wait.",
    body: "If WhatsApp disconnects, outbound replies queue up. They send when you're back. No lost confirmations.",
  },
  {
    title: "You can still just… talk to people.",
    body: "Edit the draft. Ignore it. Reply yourself. Stylus is a helper, not autopilot. Customers still think they're texting you.",
  },
]

export function BentoFeatures() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border/50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mb-12 max-w-lg">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            The stuff that actually matters
          </h2>
          <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">
            We built this because &ldquo;just use a spreadsheet&rdquo; stops working around order
            number thirty.
          </p>
        </FadeIn>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 md:grid-cols-2">
          {truths.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.05}>
              <article className="bg-background h-full p-7 sm:p-8">
                <h3 className="font-heading text-lg font-semibold leading-snug">
                  {item.title}
                </h3>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {item.body}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
