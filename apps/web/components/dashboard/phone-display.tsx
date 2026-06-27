export function formatPhoneNumber(phone: string) {
  const digits = phone.replace("@c.us", "").replace(/\D/g, "")
  return digits ? `+${digits}` : phone
}

export function PhoneDisplay({ phone, className }: { phone: string; className?: string }) {
  return <span className={className}>{formatPhoneNumber(phone)}</span>
}
