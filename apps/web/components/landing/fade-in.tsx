"use client"

import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

type FadeInProps = {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  y?: number
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.55,
  y = 16,
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
