import type { InputHTMLAttributes } from "react"
import { Button } from "@workspace/ui/components/button"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"
import {
  createProductAction,
  deleteProductAction,
  updateProductStockAction,
} from "./actions"

export default async function ProductsPage() {
  const vendor = await getActiveVendor()

  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { name: "asc" },
  })

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Catalog used by the AI when drafting replies and creating orders.
        </p>
      </div>

      <section className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-sm font-medium">Add product</h2>
        <form action={createProductAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Name" name="name" required placeholder="Dark Chocolate Cookie" />
          <Field label="SKU" name="sku" placeholder="COOKIE-01" />
          <Field label="Price" name="price" type="number" step="0.01" min="0" required placeholder="3.50" />
          <Field label="Stock" name="stock" type="number" min="0" required placeholder="50" />
          <div className="sm:col-span-2">
            <Field label="Description" name="description" placeholder="Optional" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm">
              Add product
            </Button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Catalog ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm">No products yet.</p>
        ) : (
          <div className="border-border overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-border border-t">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                      {product.sku ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">${product.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <form
                        action={updateProductStockAction.bind(null, product.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          name="stock"
                          type="number"
                          min={0}
                          defaultValue={product.stock}
                          className="border-input bg-background h-8 w-20 rounded-md border px-2 text-sm"
                        />
                        <Button type="submit" size="xs" variant="outline">
                          Save
                        </Button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteProductAction.bind(null, product.id)}>
                        <Button type="submit" size="xs" variant="ghost">
                          Delete
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  ...props
}: {
  label: string
  name: string
  type?: string
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <input
        name={name}
        type={type}
        className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
        {...props}
      />
    </label>
  )
}
