import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { cn } from "@workspace/ui/lib/utils"

export function ConversationThread({
  messages,
}: {
  messages: { id: string; content: string; sender: string; timestamp: Date }[]
}) {
  if (messages.length === 0) {
    return <p className="text-muted-foreground text-sm">No messages yet.</p>
  }

  return (
    <ScrollArea className="h-[400px] rounded-lg border p-4">
      <div className="flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-sm",
              m.sender === "CUSTOMER"
                ? "bg-muted self-start"
                : "bg-primary text-primary-foreground self-end"
            )}
          >
            <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
            <p
              className={cn(
                "mt-1 text-xs",
                m.sender === "CUSTOMER" ? "text-muted-foreground" : "text-primary-foreground/70"
              )}
            >
              {m.sender === "CUSTOMER" ? "Customer" : "You"} ·{" "}
              {m.timestamp.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
