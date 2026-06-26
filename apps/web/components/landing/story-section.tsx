"use client"

import { FadeIn } from "./fade-in"

const beats = [
  {
    time: "2:14 pm",
    heading: "Tola texts the shop.",
    quote: "abeg 2 choc cookies + red velvet cupcake. pickup by 4?",
    body: "Stylus logs the message, pulls up your menu — Dark Chocolate Cookie at $3.50, forty-three left — and figures out what she's actually asking for.",
  },
  {
    time: "2:14 pm",
    heading: "You get the draft, not Tola.",
    quote: null,
    body: "A second later your phone buzzes with a suggested reply and a proposed order: 2 cookies, 1 cupcake, $11 total. The customer sees nothing yet.",
    note: "Reply 1 · 2 · 3 · or edit [your text]",
  },
  {
    time: "2:15 pm",
    heading: "You type 1.",
    quote: "1",
    body: "Stock drops. Order lands in your dashboard. Tola gets a confirmation in the same thread — in your voice, or the draft you approved.",
  },
]

export function StorySection() {
  return (
    <section id="story" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <FadeIn>
          <p className="font-mono text-xs text-muted-foreground">one order, tuesday afternoon</p>
          <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            This is what actually happens.
          </h2>
          <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed">
            No new app for your customers. No copy-pasting prices from a spreadsheet.
            Just your WhatsApp, with someone competent reading over your shoulder.
          </p>
        </FadeIn>

        <div className="mt-14 space-y-16 md:space-y-20">
          {beats.map((beat, i) => (
            <FadeIn key={beat.heading} delay={i * 0.06}>
              <article className="relative ps-8">
                <span className="bg-primary absolute start-0 top-1.5 size-2 rounded-full" />
                <span className="font-mono text-[11px] text-muted-foreground">{beat.time}</span>
                <h3 className="font-heading mt-1 text-xl font-semibold sm:text-2xl">
                  {beat.heading}
                </h3>
                {beat.quote && (
                  <blockquote className="border-border/60 bg-muted/40 text-foreground/90 mt-4 rounded-r-lg border-s-2 py-2 ps-4 font-mono text-sm leading-relaxed">
                    {beat.quote}
                  </blockquote>
                )}
                <p className="text-muted-foreground mt-4 text-[15px] leading-[1.75]">
                  {beat.body}
                </p>
                {beat.note && (
                  <p className="text-muted-foreground/70 mt-3 font-mono text-xs">{beat.note}</p>
                )}
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
