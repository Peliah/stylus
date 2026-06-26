/** Map internal/backend errors to vendor-safe messages. */
export function toVendorError(error: unknown, fallback = "Something went wrong. Try again."): string {
  if (!(error instanceof Error)) return fallback;

  const message = error.message.toLowerCase();

  if (
    message.includes('openwa') ||
    message.includes('gateway') ||
    message.includes('econnrefused') ||
    message.includes('unreachable') ||
    message.includes('fetch failed')
  ) {
    return "We couldn't reach WhatsApp right now. Try again in a moment.";
  }

  if (message.includes('not connected') || message.includes('scan')) {
    return 'Connect WhatsApp first by scanning the QR code.';
  }

  if (message.includes('cooldown') || message.includes('wait a minute')) {
    return 'Please wait a minute before requesting another code.';
  }

  if (message.includes('too many code')) {
    return 'Too many code requests. Try again in 15 minutes.';
  }

  if (message.includes('expired') || message.includes('not found')) {
    return 'Code expired. Request a new one.';
  }

  if (message.includes('invalid code')) {
    return 'Invalid code. Check WhatsApp and try again.';
  }

  if (message.includes('already has a shop')) {
    return 'This number already has a shop. Log in instead.';
  }

  if (message.includes('no shop found')) {
    return 'No shop found for this number. Get started to create one.';
  }

  // Pass through user-friendly messages from our own throws
  if (
    !message.includes('api error') &&
    !message.includes('internal') &&
    error.message.length < 120
  ) {
    return error.message;
  }

  return fallback;
}
