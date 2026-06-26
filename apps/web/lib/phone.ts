/** Cameroon (+237): WhatsApp sometimes omits the leading 6 on mobile numbers. */
export function canonicalizePhoneDigits(digits: string): string {
  if (digits.startsWith('237') && digits.length === 11 && digits[3] !== '6') {
    return `2376${digits.slice(3)}`;
  }
  return digits;
}

/** Normalize user input to canonical stored phone id: digits@c.us */
export function normalizeWhatsAppPhone(input: string): string {
  const raw = input.replace(/@.*$/, '').replace(/\D/g, '');
  if (!raw) {
    throw new Error('Enter a valid phone number');
  }
  const digits = canonicalizePhoneDigits(raw);
  return `${digits}@c.us`;
}

export function formatPhoneDisplay(chatId: string): string {
  const digits = chatId.replace(/@.*$/, '').replace(/\D/g, '');
  return digits ? `+${digits}` : chatId;
}

/** Phone id variants for DB lookup (canonical + raw gateway form). */
export function whatsAppPhoneVariants(input: string): string[] {
  const raw = input.replace(/@.*$/, '').replace(/\D/g, '');
  if (!raw) return [];

  const canonical = canonicalizePhoneDigits(raw);
  const variants = new Set<string>([`${raw}@c.us`, `${canonical}@c.us`]);
  return [...variants];
}

/** Compare stored chat id with gateway phone digits. */
export function phoneDigitsMatch(storedPhone: string, gatewayDigits: string): boolean {
  const a = canonicalizePhoneDigits(storedPhone.replace(/@.*$/, '').replace(/\D/g, ''));
  const b = canonicalizePhoneDigits(gatewayDigits.replace(/\D/g, ''));
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}
