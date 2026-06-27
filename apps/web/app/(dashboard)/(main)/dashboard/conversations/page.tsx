import Link from "next/link"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { getActiveVendor } from "@/lib/vendor"
import { listConversationCustomers } from "@/lib/conversations"
import { PageHeader } from "@/components/dashboard/page-header"
import { DashboardEmptyState } from "@/components/dashboard/empty-state"
import { PhoneDisplay } from "@/components/dashboard/phone-display"
import { ConversationThread } from "@/components/dashboard/conversation-thread"
import { getConversationThread } from "@/lib/conversations"

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>
}) {
  const vendor = await getActiveVendor()
  const { customer: selectedId } = await searchParams
  const customers = await listConversationCustomers(vendor.id)

  const thread = selectedId
    ? await getConversationThread(selectedId, vendor.id)
    : null

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Conversations"
        description="Message history from WhatsApp. Outbound replies are sent via Suggestions approval."
      />

      <Alert>
        <AlertDescription>
          Replies to customers go through the Suggestions queue — approve there to send.
        </AlertDescription>
      </Alert>

      {customers.length === 0 ? (
        <DashboardEmptyState title="No conversations yet" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="py-0">
            <CardContent className="flex flex-col gap-1 p-2">
              {customers.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedId === c.id ? "secondary" : "ghost"}
                  size="sm"
                  className="h-auto flex-col items-start gap-0.5 px-3 py-2"
                  nativeButton={false} render={<Link href={`/dashboard/conversations?customer=${c.id}`} />}
                >
                  <span className="font-medium">{c.name ?? <PhoneDisplay phone={c.phoneNumber} />}</span>
                  {c.lastMessage && (
                    <span className="text-muted-foreground line-clamp-1 w-full text-start text-xs">
                      {c.lastMessage.content}
                    </span>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              {!thread ? (
                <p className="text-muted-foreground text-sm">Select a conversation to view messages.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{thread.name ?? "Customer"}</p>
                      <PhoneDisplay phone={thread.phoneNumber} className="text-muted-foreground text-sm" />
                    </div>
                    <Button size="xs" variant="outline" nativeButton={false} render={<Link href={`/dashboard/customers/${thread.id}`} />}>
                      Profile
                    </Button>
                  </div>
                  <ConversationThread messages={thread.messages} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
