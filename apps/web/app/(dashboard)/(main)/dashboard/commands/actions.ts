"use server"

import { revalidatePath } from "next/cache"
import type { CommandActionType, CommandActor } from "@/lib/commands/types"
import { prisma } from "@/lib/prisma"
import { getActiveVendor } from "@/lib/vendor"
import { seedDefaultCommands } from "@/lib/commands/load"

export async function ensureCommandsAction() {
  const vendor = await getActiveVendor()
  await seedDefaultCommands(vendor.id)
  revalidatePath("/dashboard/commands")
}

export async function createCommandAction(formData: FormData) {
  const vendor = await getActiveVendor()
  const keyword = String(formData.get("keyword") ?? "").trim()
  const label = String(formData.get("label") ?? "").trim()
  const actor = String(formData.get("actor") ?? "CUSTOMER") as CommandActor
  const actionType = String(formData.get("actionType") ?? "CUSTOM_REPLY") as CommandActionType
  const description = String(formData.get("description") ?? "").trim() || null
  const replyTemplate = String(formData.get("replyTemplate") ?? "").trim() || null
  const sortOrder = Number(formData.get("sortOrder") ?? 0)

  if (!keyword) throw new Error("Keyword is required")
  if (!label) throw new Error("Label is required")

  await prisma.vendorCommand.create({
    data: {
      vendorId: vendor.id,
      keyword,
      label,
      actor,
      actionType,
      description,
      replyTemplate,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      enabled: true,
    },
  })

  revalidatePath("/dashboard/commands")
}

export async function updateCommandAction(commandId: string, formData: FormData) {
  const vendor = await getActiveVendor()
  const keyword = String(formData.get("keyword") ?? "").trim()
  const label = String(formData.get("label") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const replyTemplate = String(formData.get("replyTemplate") ?? "").trim() || null
  const enabled = formData.get("enabled") === "on" || formData.get("enabled") === "true"
  const sortOrder = Number(formData.get("sortOrder") ?? 0)

  const command = await prisma.vendorCommand.findFirst({
    where: { id: commandId, vendorId: vendor.id },
  })
  if (!command) throw new Error("Command not found")

  await prisma.vendorCommand.update({
    where: { id: commandId },
    data: {
      keyword,
      label,
      description,
      replyTemplate,
      enabled,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : command.sortOrder,
    },
  })

  revalidatePath("/dashboard/commands")
}

export async function deleteCommandAction(commandId: string) {
  const vendor = await getActiveVendor()
  const command = await prisma.vendorCommand.findFirst({
    where: { id: commandId, vendorId: vendor.id },
  })
  if (!command) throw new Error("Command not found")

  await prisma.vendorCommand.delete({ where: { id: commandId } })
  revalidatePath("/dashboard/commands")
}
