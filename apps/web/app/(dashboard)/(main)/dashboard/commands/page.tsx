import { getActiveVendor } from "@/lib/vendor"
import { getAllVendorCommands, seedDefaultCommands } from "@/lib/commands/load"
import { formatHelpMessage } from "@/lib/commands/templates"
import { PageHeader } from "@/components/dashboard/page-header"
import { CommandsManager } from "@/components/dashboard/commands-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default async function CommandsPage() {
  const vendor = await getActiveVendor()
  await seedDefaultCommands(vendor.id)

  const commands = await getAllVendorCommands(vendor.id)
  const customerCommands = commands.filter((c) => c.actor === "CUSTOMER" && c.enabled)
  const helpPreview = formatHelpMessage(
    customerCommands.map((c) => ({
      keyword: c.keyword,
      label: c.label,
      description: c.description,
    })),
    vendor.name
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Commands"
        description="Configure how customers and you interact via WhatsApp keywords and reply templates."
      />

      <CommandsManager commands={commands} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Customer /help preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted/50 whitespace-pre-wrap rounded-lg p-4 text-sm">{helpPreview}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
