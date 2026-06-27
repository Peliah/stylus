import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"
import { PageHeader } from "@/components/dashboard/page-header"
import { DashboardEmptyState } from "@/components/dashboard/empty-state"
import { PhoneDisplay } from "@/components/dashboard/phone-display"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Button } from "@workspace/ui/components/button"

export default async function CustomersPage() {
  const vendor = await getActiveVendor()

  const customers = await prisma.customer.findMany({
    where: { vendorId: vendor.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      _count: { select: { orders: true, messages: true } },
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Profiles auto-created from WhatsApp conversations."
      />

      {customers.length === 0 ? (
        <DashboardEmptyState title="No customers yet" description="Customers appear when they message your WhatsApp." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Loyalty</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name ?? "—"}</TableCell>
                <TableCell>
                  <PhoneDisplay phone={c.phoneNumber} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{c.loyaltyClass}</Badge>
                </TableCell>
                <TableCell>{c._count.orders}</TableCell>
                <TableCell>{c._count.messages}</TableCell>
                <TableCell className="text-right">
                  <Button size="xs" variant="outline" nativeButton={false} render={<Link href={`/dashboard/customers/${c.id}`} />}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
