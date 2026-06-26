import { Button } from "@workspace/ui/components/button"
import type { SuggestedAction } from "@/lib/openai"
import {
  approveActionsOnlyAction,
  approveSendAction,
  approveWithEditAction,
  rejectSuggestionAction,
} from "@/app/(dashboard)/dashboard/suggestions/actions"

interface SuggestionCardProps {
  suggestion: {
    id: string
    customerPhoneNumber: string
    proposedReply: string
    proposedActions: SuggestedAction[]
    createdAt: string
  }
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const orderActions = suggestion.proposedActions.filter((a) => a.type === "CREATE_ORDER")

  return (
    <article className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {formatPhone(suggestion.customerPhoneNumber)}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatWhen(new Date(suggestion.createdAt))}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Proposed reply
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {suggestion.proposedReply}
        </p>
      </div>

      {orderActions.length > 0 && (
        <div className="mt-4 space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
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

      <div className="mt-5 flex flex-wrap gap-2">
        <form action={approveSendAction.bind(null, suggestion.id)}>
          <Button type="submit" size="sm">
            Approve & send
          </Button>
        </form>
        <form action={approveActionsOnlyAction.bind(null, suggestion.id)}>
          <Button type="submit" size="sm" variant="secondary">
            Actions only
          </Button>
        </form>
        <form action={rejectSuggestionAction.bind(null, suggestion.id)}>
          <Button type="submit" size="sm" variant="destructive">
            Reject
          </Button>
        </form>
      </div>

      <form
        action={approveWithEditAction.bind(null, suggestion.id)}
        className="mt-4 flex flex-col gap-2"
      >
        <label className="text-muted-foreground text-xs font-medium" htmlFor={`edit-${suggestion.id}`}>
          Or send edited reply
        </label>
        <textarea
          id={`edit-${suggestion.id}`}
          name="reply"
          defaultValue={suggestion.proposedReply}
          rows={3}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3"
        />
        <div>
          <Button type="submit" size="sm" variant="outline">
            Send edited reply
          </Button>
        </div>
      </form>
    </article>
  )
}

function formatPhone(phone: string) {
  const digits = phone.replace("@c.us", "")
  return `+${digits}`
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
