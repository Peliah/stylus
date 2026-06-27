"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import type { VendorCommandRecord } from "@/lib/commands/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Switch } from "@workspace/ui/components/switch"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Card, CardContent } from "@workspace/ui/components/card"
import { TEMPLATE_VARIABLES } from "@/lib/commands/types"
import {
  createCommandAction,
  deleteCommandAction,
  updateCommandAction,
} from "@/app/(dashboard)/(main)/dashboard/commands/actions"

const CUSTOMER_ACTIONS = [
  "SHOW_CATALOG",
  "CHECK_STOCK",
  "PLACE_ORDER",
  "CHECK_ORDER_STATUS",
  "CUSTOM_REPLY",
  "HELP",
] as const

const VENDOR_ACTIONS = [
  "APPROVE_SEND",
  "APPROVE_ACTIONS",
  "REJECT",
  "APPROVE_EDIT",
  "LIST_STOCK",
  "UPDATE_STOCK",
  "HELP",
] as const

export function CommandsManager({ commands }: { commands: VendorCommandRecord[] }) {
  const [pending, startTransition] = useTransition()
  const customer = commands.filter((c) => c.actor === "CUSTOMER")
  const vendor = commands.filter((c) => c.actor === "VENDOR")

  function run(action: () => Promise<void>, success: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(success)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed")
      }
    })
  }

  return (
    <Tabs defaultValue="customer">
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="customer">Customer ({customer.length})</TabsTrigger>
          <TabsTrigger value="vendor">Vendor ({vendor.length})</TabsTrigger>
        </TabsList>
        <CreateCommandDialog disabled={pending} onSave={run} />
      </div>

      <TabsContent value="customer" className="mt-4">
        <CommandTable items={customer} disabled={pending} onSave={run} />
      </TabsContent>
      <TabsContent value="vendor" className="mt-4">
        <CommandTable items={vendor} disabled={pending} onSave={run} />
      </TabsContent>
    </Tabs>
  )
}

function CommandTable({
  items,
  disabled,
  onSave,
}: {
  items: VendorCommandRecord[]
  disabled: boolean
  onSave: (action: () => Promise<void>, msg: string) => void
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((cmd) => (
              <TableRow key={cmd.id}>
                <TableCell className="font-mono text-sm">{cmd.keyword}</TableCell>
                <TableCell>{cmd.label}</TableCell>
                <TableCell>
                  <Badge variant="outline">{cmd.actionType}</Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={cmd.enabled}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onSave(async () => {
                        const fd = new FormData()
                        fd.set("keyword", cmd.keyword)
                        fd.set("label", cmd.label)
                        fd.set("description", cmd.description ?? "")
                        fd.set("replyTemplate", cmd.replyTemplate ?? "")
                        fd.set("enabled", String(checked))
                        fd.set("sortOrder", String(cmd.sortOrder))
                        await updateCommandAction(cmd.id, fd)
                      }, "Command updated")
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <EditCommandDialog command={cmd} disabled={disabled} onSave={onSave} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function CreateCommandDialog({
  disabled,
  onSave,
}: {
  disabled: boolean
  onSave: (action: () => Promise<void>, msg: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" disabled={disabled} />}>Add command</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add command</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            onSave(async () => {
              await createCommandAction(fd)
              setOpen(false)
            }, "Command created")
          }}
        >
          <CommandFormFields />
          <DialogFooter className="mt-4">
            <Button type="submit" size="sm">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditCommandDialog({
  command,
  disabled,
  onSave,
}: {
  command: VendorCommandRecord
  disabled: boolean
  onSave: (action: () => Promise<void>, msg: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="outline" disabled={disabled} />}>
        Edit
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {command.keyword}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            fd.set("enabled", command.enabled ? "true" : "false")
            onSave(async () => {
              await updateCommandAction(command.id, fd)
              setOpen(false)
            }, "Command updated")
          }}
        >
          <CommandFormFields command={command} />
          <DialogFooter className="mt-4 flex justify-between sm:justify-between">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() =>
                onSave(async () => {
                  await deleteCommandAction(command.id)
                  setOpen(false)
                }, "Command deleted")
              }
            >
              Delete
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CommandFormFields({ command }: { command?: VendorCommandRecord }) {
  const actions = command?.actor === "VENDOR" ? VENDOR_ACTIONS : CUSTOMER_ACTIONS

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Keyword</FieldLabel>
        <Input name="keyword" defaultValue={command?.keyword} required placeholder="/menu" />
      </Field>
      <Field>
        <FieldLabel>Label</FieldLabel>
        <Input name="label" defaultValue={command?.label} required />
      </Field>
      {!command && (
        <>
          <Field>
            <FieldLabel>Actor</FieldLabel>
            <Select name="actor" defaultValue="CUSTOMER">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="VENDOR">Vendor</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Action type</FieldLabel>
            <Select name="actionType" defaultValue="CUSTOM_REPLY">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CUSTOMER_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </>
      )}
      <Field>
        <FieldLabel>Description</FieldLabel>
        <Input name="description" defaultValue={command?.description ?? ""} />
      </Field>
      <Field>
        <FieldLabel>Reply template</FieldLabel>
        <Textarea name="replyTemplate" defaultValue={command?.replyTemplate ?? ""} rows={4} />
        <p className="text-muted-foreground mt-1 text-xs">
          Variables: {TEMPLATE_VARIABLES.join(", ")}
        </p>
      </Field>
      <Field>
        <FieldLabel>Sort order</FieldLabel>
        <Input name="sortOrder" type="number" defaultValue={command?.sortOrder ?? 0} />
      </Field>
    </FieldGroup>
  )
}
