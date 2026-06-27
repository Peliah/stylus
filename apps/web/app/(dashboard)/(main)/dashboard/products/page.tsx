import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProductCatalog } from "@/components/dashboard/product-catalog"

export default async function ProductsPage() {
  const vendor = await getActiveVendor()

  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { name: "asc" },
  })

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Products"
        description="Catalog used by the AI when drafting replies and creating orders."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Catalog ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductCatalog products={products} />
        </CardContent>
      </Card>
    </div>
  )
}
