import type { DefaultCommandSeed } from "./types"

export const DEFAULT_VENDOR_COMMANDS: DefaultCommandSeed[] = [
  {
    keyword: "/help",
    actor: "CUSTOMER",
    actionType: "HELP",
    label: "Help",
    description: "List available commands",
    replyTemplate:
      "Welcome to {{shop_name}}! Here are the commands you can use:\n/menu — view products\n/stock [product] — check availability\n/buy [product] [qty] — place an order",
    sortOrder: 0,
  },
  {
    keyword: "/menu",
    actor: "CUSTOMER",
    actionType: "SHOW_CATALOG",
    label: "View menu",
    replyTemplate: "Here's what we have:\n{{catalog}}",
    sortOrder: 1,
  },
  {
    keyword: "/stock",
    actor: "CUSTOMER",
    actionType: "CHECK_STOCK",
    label: "Check stock",
    replyTemplate: "{{product_name}}: {{stock}} in stock at {{price}}",
    sortOrder: 2,
  },
  {
    keyword: "/buy",
    actor: "CUSTOMER",
    actionType: "PLACE_ORDER",
    label: "Place order",
    replyTemplate: "Thanks {{customer_name}}! I've noted your order:\n{{order_summary}}",
    sortOrder: 3,
  },
  {
    keyword: "1",
    actor: "VENDOR",
    actionType: "APPROVE_SEND",
    label: "Approve and send",
    sortOrder: 0,
  },
  {
    keyword: "2",
    actor: "VENDOR",
    actionType: "APPROVE_ACTIONS",
    label: "Approve actions only",
    sortOrder: 1,
  },
  {
    keyword: "3",
    actor: "VENDOR",
    actionType: "REJECT",
    label: "Reject suggestion",
    sortOrder: 2,
  },
  {
    keyword: "edit",
    actor: "VENDOR",
    actionType: "APPROVE_EDIT",
    label: "Send edited reply",
    sortOrder: 3,
  },
  {
    keyword: "stock",
    actor: "VENDOR",
    actionType: "LIST_STOCK",
    label: "List inventory",
    sortOrder: 4,
  },
]
