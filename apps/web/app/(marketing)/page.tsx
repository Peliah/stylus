import { HeroSection } from "@/components/landing/hero-section"
import { MarqueeStrip } from "@/components/landing/marquee-strip"
import { StorySection } from "@/components/landing/story-section"
import { BentoFeatures } from "@/components/landing/bento-features"
import { CtaSection } from "@/components/landing/cta-section"

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <StorySection />
      <BentoFeatures />
      <CtaSection />
    </>
  )
}
