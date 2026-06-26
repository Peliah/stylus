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
