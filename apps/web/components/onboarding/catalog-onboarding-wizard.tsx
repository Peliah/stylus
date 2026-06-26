"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  addFirstProductAction,
  finishOnboardingAction,
} from "@/app/(dashboard)/onboarding/actions"

interface CatalogOnboardingProps {
  productCount: number
  shopName: string
}

export function CatalogOnboardingWizard({ productCount, shopName }: CatalogOnboardingProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [count, setCount] = useState(productCount)

  function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await addFirstProductAction(formData)
        e.currentTarget.reset()
        setCount((c) => c + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add product")
      }
    })
  }

  function handleFinish() {
    setError(null)
    startTransition(async () => {
      try {
        await finishOnboardingAction()
        router.replace("/dashboard")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to finish setup")
      }
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Almost done
        </p>
        <h1 className="font-heading mt-2 text-2xl font-semibold tracking-tight">
          Add your first product
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {shopName} is connected. The AI uses your catalog when drafting replies and creating
          orders.
        </p>
      </div>

      {error && (
        <p className="text-destructive border-destructive/30 bg-destructive/10 rounded-lg border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {count > 0 ? (
        <p className="text-muted-foreground text-sm">
          You have {count} product{count === 1 ? "" : "s"} in your catalog.
        </p>
      ) : (
        <form
          onSubmit={handleAddProduct}
          className="border-border bg-card grid gap-3 rounded-xl border p-4"
        >
          <Field label="Name" name="name" required placeholder="Dark Chocolate Cookie" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Price" name="price" type="number" step="0.01" min="0" required placeholder="3.50" />
            <Field label="Stock" name="stock" type="number" min="0" required placeholder="50" />
          </div>
          <Field label="SKU (optional)" name="sku" placeholder="COOKIE-01" />
          <Button type="submit" disabled={pending} size="sm">
            Add product
          </Button>
        </form>
      )}

      <Button type="button" disabled={pending} onClick={handleFinish} className="rounded-full">
        {count > 0 ? "Go to dashboard" : "Skip for now"}
      </Button>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  ...props
}: {
  label: string
  name: string
  type?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <input
        name={name}
        type={type}
        className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
        {...props}
      />
    </label>
  )
}
