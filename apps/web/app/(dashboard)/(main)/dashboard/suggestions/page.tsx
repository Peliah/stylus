import { prisma } from "@/lib/prisma"
import { parseProposedActions } from "@/lib/suggestions"
import { getActiveVendor } from "@/lib/vendor"
import { PageHeader } from "@/components/dashboard/page-header"
import { DashboardEmptyState } from "@/components/dashboard/empty-state"
import { SuggestionCard } from "@/components/dashboard/suggestion-card"
import { SuggestionStatusBadge } from "@/components/dashboard/status-badge"
import { PhoneDisplay } from "@/components/dashboard/phone-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export default async function SuggestionsPage() {
  const vendor = await getActiveVendor()

  const suggestions = await prisma.suggestion.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const pending = suggestions.filter((s) => s.status === "PENDING")
  const history = suggestions.filter((s) => s.status !== "PENDING")

  const customerMessages = await Promise.all(
    pending.map(async (s) => ({
      id: s.id,
      message: await getTriggerMessage(vendor.id, s.customerPhoneNumber, s.createdAt),
    }))
  )
  const messageBySuggestion = Object.fromEntries(
    customerMessages.map((m) => [m.id, m.message])
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Suggestions"
        description='AI drafts waiting for approval. Same actions as WhatsApp: 1 / 2 / 3 / edit.'
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 flex flex-col gap-4">
          {pending.length === 0 ? (
            <DashboardEmptyState
              title="No pending suggestions"
              description="New drafts appear when customers message your WhatsApp."
            />
          ) : (
            pending.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={{
                  id: suggestion.id,
                  customerPhoneNumber: suggestion.customerPhoneNumber,
                  proposedReply: suggestion.proposedReply,
                  proposedActions: parseProposedActions(suggestion.proposedActions),
                  createdAt: suggestion.createdAt.toISOString(),
                  intent: suggestion.intent,
                  customerMessage: messageBySuggestion[suggestion.id],
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <DashboardEmptyState title="No history yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reply</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <PhoneDisplay phone={s.customerPhoneNumber} />
                    </TableCell>
                    <TableCell>
                      <SuggestionStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{s.proposedReply}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatWhen(s.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function getTriggerMessage(
  vendorId: string,
  customerPhoneNumber: string,
  before: Date
) {
  const customer = await prisma.customer.findUnique({
    where: { vendorId_phoneNumber: { vendorId, phoneNumber: customerPhoneNumber } },
  })
  if (!customer) return null

  const message = await prisma.message.findFirst({
    where: {
      customerId: customer.id,
      sender: "CUSTOMER",
      timestamp: { lte: before },
    },
    orderBy: { timestamp: "desc" },
  })

  return message?.content ?? null
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
