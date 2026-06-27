"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Textarea } from "@workspace/ui/components/textarea"
import { PhoneDisplay } from "@/components/dashboard/phone-display"
import type { SuggestedAction } from "@/lib/openai"
import {
  approveActionsOnlyAction,
  approveSendAction,
  approveWithEditAction,
  rejectSuggestionAction,
} from "@/app/(dashboard)/(main)/dashboard/suggestions/actions"

interface SuggestionCardProps {
  suggestion: {
    id: string
    customerPhoneNumber: string
    proposedReply: string
    proposedActions: SuggestedAction[]
    createdAt: string
    intent?: string | null
    customerMessage?: string | null
  }
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const [pending, startTransition] = useTransition()
  const orderActions = suggestion.proposedActions.filter((a) => a.type === "CREATE_ORDER")

  function run(action: () => Promise<void>, success: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(success)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              <PhoneDisplay phone={suggestion.customerPhoneNumber} />
            </CardTitle>
            <p className="text-muted-foreground text-xs">{formatWhen(new Date(suggestion.createdAt))}</p>
          </div>
          {suggestion.intent && <Badge variant="outline">{suggestion.intent}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {suggestion.customerMessage && (
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
              Customer message
            </p>
            <p className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed">{suggestion.customerMessage}</p>
          </div>
        )}
        <Separator />
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
            Proposed reply
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{suggestion.proposedReply}</p>
        </div>
        {orderActions.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
              Proposed actions
            </p>
            <ul className="text-sm">
              {orderActions.flatMap((action) =>
                (action.items ?? []).map((item) => (
                  <li key={`${item.productName}-${item.quantity}`}>
                    Create order: {item.quantity}× {item.productName}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => approveSendAction(suggestion.id), "Approved and sent")}
          >
            Approve & send
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => approveActionsOnlyAction(suggestion.id), "Actions applied")}
          >
            Actions only
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => run(() => rejectSuggestionAction(suggestion.id), "Suggestion rejected")}
          >
            Reject
          </Button>
        </div>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            run(
              () => approveWithEditAction(suggestion.id, formData),
              "Custom reply sent"
            )
          }}
        >
          <label className="text-muted-foreground text-xs font-medium" htmlFor={`edit-${suggestion.id}`}>
            Or send edited reply
          </label>
          <Textarea
            id={`edit-${suggestion.id}`}
            name="reply"
            defaultValue={suggestion.proposedReply}
            rows={3}
          />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Send edited reply
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
