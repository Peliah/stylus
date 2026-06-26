/** Normalize user input to canonical stored phone id: digits@c.us */
export function normalizeWhatsAppPhone(input: string): string {
  const digits = input.replace(/@.*$/, '').replace(/\D/g, '');
  if (!digits) {
    throw new Error('Enter a valid phone number');
  }
  return `${digits}@c.us`;
}

export function formatPhoneDisplay(chatId: string): string {
  const digits = chatId.replace(/@.*$/, '').replace(/\D/g, '');
  return digits ? `+${digits}` : chatId;
}

/** Compare stored chat id with gateway phone digits. */
export function phoneDigitsMatch(storedPhone: string, gatewayDigits: string): boolean {
  const a = storedPhone.replace(/@.*$/, '').replace(/\D/g, '');
  const b = gatewayDigits.replace(/\D/g, '');
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}
