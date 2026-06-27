import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"
import { PageHeader } from "@/components/dashboard/page-header"
import { PhoneDisplay } from "@/components/dashboard/phone-display"
import { OrderStatusBadge } from "@/components/dashboard/status-badge"
import { ConversationThread } from "@/components/dashboard/conversation-thread"
import { updateCustomerAction } from "../actions"

const LOYALTY_OPTIONS = ["Regular", "VIP", "Wholesale", "New"]

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const vendor = await getActiveVendor()

  const customer = await prisma.customer.findFirst({
    where: { id, vendorId: vendor.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
      messages: { orderBy: { timestamp: "asc" } },
    },
  })

  if (!customer) notFound()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title={customer.name ?? "Customer"}
        description={<PhoneDisplay phone={customer.phoneNumber} />}
        actions={
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard/customers" />}>
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateCustomerAction.bind(null, customer.id)}>
            <FieldGroup>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input name="name" defaultValue={customer.name ?? ""} />
              </Field>
              <Field>
                <FieldLabel htmlFor="loyaltyClass">Loyalty class</FieldLabel>
                <NativeSelect
                  id="loyaltyClass"
                  name="loyaltyClass"
                  defaultValue={customer.loyaltyClass}
                  className="w-full"
                >
                  {LOYALTY_OPTIONS.map((o) => (
                    <NativeSelectOption key={o} value={o}>
                      {o}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>Notes</FieldLabel>
                <Textarea name="notes" defaultValue={customer.notes ?? ""} rows={3} />
              </Field>
              <Button type="submit" size="sm">
                Save profile
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="orders">Orders ({customer.orders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="mt-4">
          <ConversationThread messages={customer.messages} />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          {customer.orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="tabular-nums">${o.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {o.createdAt.toLocaleDateString()}
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
