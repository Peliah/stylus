export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key]
    if (value === undefined || value === null) return ""
    return String(value)
  })
}

export function formatCatalog(
  products: { name: string; price: number; stock: number }[]
) {
  if (products.length === 0) return "No products in catalog yet."
  return products
    .map((p) => `• ${p.name} — $${p.price.toFixed(2)} (${p.stock} in stock)`)
    .join("\n")
}

export function formatHelpMessage(
  commands: { keyword: string; label: string; description?: string | null }[],
  shopName: string
) {
  const lines = commands.map(
    (c) => `• ${c.keyword} — ${c.label}${c.description ? `: ${c.description}` : ""}`
  )
  return `*${shopName}*\n\nAvailable commands:\n${lines.join("\n")}`
}
