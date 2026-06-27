import { prisma } from "@/lib/prisma"
import { DEFAULT_VENDOR_COMMANDS } from "./defaults"
import type { CommandActor } from "./types"

export async function seedDefaultCommands(vendorId: string) {
  const existing = await prisma.vendorCommand.count({ where: { vendorId } })
  if (existing > 0) return

  await prisma.vendorCommand.createMany({
    data: DEFAULT_VENDOR_COMMANDS.map((cmd) => ({
      vendorId,
      keyword: cmd.keyword,
      actor: cmd.actor,
      actionType: cmd.actionType,
      label: cmd.label,
      description: cmd.description ?? null,
      replyTemplate: cmd.replyTemplate ?? null,
      sortOrder: cmd.sortOrder,
      enabled: true,
    })),
  })
}

export async function getVendorCommands(vendorId: string, actor?: CommandActor) {
  return prisma.vendorCommand.findMany({
    where: {
      vendorId,
      enabled: true,
      ...(actor ? { actor } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { keyword: "asc" }],
  })
}

export async function getAllVendorCommands(vendorId: string) {
  return prisma.vendorCommand.findMany({
    where: { vendorId },
    orderBy: [{ actor: "asc" }, { sortOrder: "asc" }],
  })
}
