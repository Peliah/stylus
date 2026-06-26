"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"

export async function createProductAction(formData: FormData) {
  const vendor = await getActiveVendor()
  const name = String(formData.get("name") ?? "").trim()
  const sku = String(formData.get("sku") ?? "").trim() || null
  const price = Number(formData.get("price"))
  const stock = Number(formData.get("stock"))
  const description = String(formData.get("description") ?? "").trim() || null

  if (!name) throw new Error("Product name is required")
  if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price")
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Invalid stock")

  await prisma.product.create({
    data: {
      vendorId: vendor.id,
      name,
      sku,
      price,
      stock,
      description,
    },
  })

  revalidatePath("/dashboard/products")
  revalidatePath("/dashboard")
}

export async function updateProductStockAction(productId: string, formData: FormData) {
  const vendor = await getActiveVendor()
  const stock = Number(formData.get("stock"))

  if (!Number.isInteger(stock) || stock < 0) throw new Error("Invalid stock")

  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId: vendor.id },
  })
  if (!product) throw new Error("Product not found")

  await prisma.product.update({
    where: { id: productId },
    data: { stock },
  })

  revalidatePath("/dashboard/products")
}

export async function deleteProductAction(productId: string) {
  const vendor = await getActiveVendor()
  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId: vendor.id },
  })
  if (!product) throw new Error("Product not found")

  await prisma.product.delete({ where: { id: productId } })
  revalidatePath("/dashboard/products")
  revalidatePath("/dashboard")
}
