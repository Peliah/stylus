export type CommandActor = "CUSTOMER" | "VENDOR"

export type CommandActionType =
  | "SHOW_CATALOG"
  | "CHECK_STOCK"
  | "PLACE_ORDER"
  | "CHECK_ORDER_STATUS"
  | "CUSTOM_REPLY"
  | "LIST_STOCK"
  | "UPDATE_STOCK"
  | "APPROVE_SEND"
  | "APPROVE_ACTIONS"
  | "REJECT"
  | "APPROVE_EDIT"
  | "HELP"

export interface DefaultCommandSeed {
  keyword: string
  actor: CommandActor
  actionType: CommandActionType
  label: string
  description?: string
  replyTemplate?: string
  sortOrder: number
}

export const TEMPLATE_VARIABLES = [
  "{{shop_name}}",
  "{{catalog}}",
  "{{product_name}}",
  "{{stock}}",
  "{{price}}",
  "{{order_total}}",
  "{{order_summary}}",
  "{{customer_name}}",
] as const

export interface VendorCommandRecord {
  id: string
  vendorId: string
  keyword: string
  actor: CommandActor
  actionType: CommandActionType
  label: string
  description: string | null
  replyTemplate: string | null
  enabled: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
