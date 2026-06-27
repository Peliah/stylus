import type { VendorCommandRecord } from "./types"

export interface ParsedCommand {
  command: VendorCommandRecord
  args: string
}

export function parseMessage(text: string, commands: VendorCommandRecord[]): ParsedCommand | null {
  const trimmed = text.trim()
  const lower = trimmed.toLowerCase()

  const sorted = [...commands].sort((a, b) => b.keyword.length - a.keyword.length)

  for (const command of sorted) {
    const kw = command.keyword.toLowerCase()

    if (kw === "edit" && lower.startsWith("edit ")) {
      return { command, args: trimmed.slice(5).trim() }
    }

    if (kw.startsWith("/")) {
      if (lower === kw) return { command, args: "" }
      if (lower.startsWith(`${kw} `)) {
        return { command, args: trimmed.slice(command.keyword.length).trim() }
      }
      continue
    }

    if (lower === kw) return { command, args: "" }
    if (lower.startsWith(`${kw} `)) {
      return { command, args: trimmed.slice(command.keyword.length).trim() }
    }

    if (command.actionType === "UPDATE_STOCK") {
      const match = trimmed.match(/^set\s+(.+?)\s+stock\s+to\s+(\d+)$/i)
      if (match) {
        return { command, args: `${match[1]}|${match[2]}` }
      }
    }
  }

  return null
}
