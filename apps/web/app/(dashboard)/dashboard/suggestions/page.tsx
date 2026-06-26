import { prisma } from "@/lib/prisma"
import { parseProposedActions } from "@/lib/suggestions"
import { getActiveVendor } from "@/lib/vendor"
import { SuggestionCard } from "@/components/dashboard/suggestion-card"

export default async function SuggestionsPage() {
  const vendor = await getActiveVendor()

  const suggestions = await prisma.suggestion.findMany({
    where: { vendorId: vendor.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 50,
  })

  const pending = suggestions.filter((s) => s.status === "PENDING")
  const history = suggestions.filter((s) => s.status !== "PENDING")

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Suggestions</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          AI drafts waiting for your approval. Same actions as WhatsApp{" "}
          <span className="font-mono text-xs">1 / 2 / 3 / edit</span>.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-muted-foreground border-border bg-card rounded-xl border p-6 text-sm">
          No pending suggestions. New drafts appear when customers message your WhatsApp.
        </p>
      ) : (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium">Pending ({pending.length})</h2>
          {pending.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={{
                id: suggestion.id,
                customerPhoneNumber: suggestion.customerPhoneNumber,
                proposedReply: suggestion.proposedReply,
                proposedActions: parseProposedActions(suggestion.proposedActions),
                createdAt: suggestion.createdAt.toISOString(),
              }}
            />
          ))}
        </section>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-sm font-medium">Recent history</h2>
          {history.map((s) => (
            <div
              key={s.id}
              className="border-border bg-card text-muted-foreground rounded-xl border p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs">{formatPhone(s.customerPhoneNumber)}</span>
                <StatusBadge status={s.status} />
              </div>
              <p className="mt-2 line-clamp-2">{s.proposedReply}</p>
              <p className="mt-2 text-xs">{formatWhen(s.createdAt)}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function formatPhone(phone: string) {
  return phone.replace("@c.us", "")
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "APPROVED"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : "bg-muted text-muted-foreground"

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {status.toLowerCase()}
    </span>
  )
}
