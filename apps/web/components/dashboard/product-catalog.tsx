"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory"
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  updateProductStockAction,
} from "@/app/(dashboard)/(main)/dashboard/products/actions"

type Product = {
  id: string
  name: string
  sku: string | null
  price: number
  stock: number
  description: string | null
}

export function ProductCatalog({ products }: { products: Product[] }) {
  const [pending, startTransition] = useTransition()

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
    <div className="flex flex-col gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          run(() => createProductAction(fd), "Product added")
          e.currentTarget.reset()
        }}
      >
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" required placeholder="Dark Chocolate Cookie" />
          </Field>
          <Field>
            <FieldLabel htmlFor="sku">SKU</FieldLabel>
            <Input id="sku" name="sku" placeholder="COOKIE-01" />
          </Field>
          <Field>
            <FieldLabel htmlFor="price">Price</FieldLabel>
            <Input id="price" name="price" type="number" step="0.01" min="0" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="stock">Stock</FieldLabel>
            <Input id="stock" name="stock" type="number" min="0" required />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea id="description" name="description" rows={2} />
          </Field>
          <Button type="submit" size="sm" disabled={pending}>
            Add product
          </Button>
        </FieldGroup>
      </form>

      {products.length === 0 ? (
        <p className="text-muted-foreground text-sm">No products yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {product.name}
                  {product.stock <= LOW_STOCK_THRESHOLD && (
                    <Badge variant="destructive" className="ms-2">
                      Low
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {product.sku ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums">${product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const fd = new FormData(e.currentTarget)
                      run(() => updateProductStockAction(product.id, fd), "Stock updated")
                    }}
                  >
                    <Input
                      name="stock"
                      type="number"
                      min={0}
                      defaultValue={product.stock}
                      className="h-8 w-20"
                    />
                    <Button type="submit" size="xs" variant="outline" disabled={pending}>
                      Save
                    </Button>
                  </form>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <EditProductDialog product={product} disabled={pending} onSave={run} />
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button size="xs" variant="ghost" />}>
                        Delete
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              run(() => deleteProductAction(product.id), "Product deleted")
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function EditProductDialog({
  product,
  disabled,
  onSave,
}: {
  product: Product
  disabled: boolean
  onSave: (action: () => Promise<void>, msg: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="outline" disabled={disabled} />}>
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
        </DialogHeader>
        <form
          action={(formData) =>
            onSave(async () => {
              await updateProductAction(product.id, formData)
              setOpen(false)
            }, "Product updated")
          }
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input name="name" defaultValue={product.name} required />
            </Field>
            <Field>
              <FieldLabel>SKU</FieldLabel>
              <Input name="sku" defaultValue={product.sku ?? ""} />
            </Field>
            <Field>
              <FieldLabel>Price</FieldLabel>
              <Input name="price" type="number" step="0.01" defaultValue={product.price} required />
            </Field>
            <Field>
              <FieldLabel>Stock</FieldLabel>
              <Input name="stock" type="number" min={0} defaultValue={product.stock} required />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea name="description" defaultValue={product.description ?? ""} rows={2} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" size="sm">
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
