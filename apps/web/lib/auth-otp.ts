import crypto from 'node:crypto';
import { redis } from './redis';
import { deliverTextMessage } from './openwa-client';
import { formatPhoneDisplay, normalizeWhatsAppPhone } from './phone';

const OTP_TTL_SECONDS = 10 * 60;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_SECONDS = 15 * 60;

function otpKey(phone: string) {
  return `auth:otp:${phone}`;
}

function cooldownKey(phone: string) {
  return `auth:otp:cooldown:${phone}`;
}

function rateKey(phone: string) {
  return `auth:otp:rate:${phone}`;
}

function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export async function sendLoginOtp(
  phoneInput: string,
  options?: { sessionId?: string }
): Promise<{ phone: string }> {
  const phone = normalizeWhatsAppPhone(phoneInput);

  const onCooldown = await redis.get(cooldownKey(phone));
  if (onCooldown) {
    throw new Error('Please wait a minute before requesting another code.');
  }

  const sendCount = await redis.incr(rateKey(phone));
  if (sendCount === 1) {
    await redis.expire(rateKey(phone), SEND_WINDOW_SECONDS);
  }
  if (sendCount > MAX_SENDS_PER_WINDOW) {
    throw new Error('Too many code requests. Try again in 15 minutes.');
  }

  const code = generateCode();
  await redis.set(otpKey(phone), code, 'EX', OTP_TTL_SECONDS);
  await redis.set(cooldownKey(phone), '1', 'EX', OTP_COOLDOWN_SECONDS);

  const message =
    `*Stylus login code*\n\n` +
    `Your verification code is: *${code}*\n\n` +
    `It expires in 10 minutes. If you didn't request this, ignore this message.`;

  try {
    await deliverTextMessage(phone, message, options?.sessionId);
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp code';
    throw new Error(errMessage);
  }

  return { phone };
}

export async function verifyLoginOtp(phoneInput: string, codeInput: string): Promise<string> {
  const phone = normalizeWhatsAppPhone(phoneInput);
  const code = codeInput.trim();

  if (!/^\d{6}$/.test(code)) {
    throw new Error('Enter the 6-digit code from WhatsApp.');
  }

  const stored = await redis.get(otpKey(phone));
  if (!stored) {
    throw new Error('Code expired or not found. Request a new one.');
  }

  const storedBuf = Buffer.from(stored);
  const codeBuf = Buffer.from(code);
  if (storedBuf.length !== codeBuf.length || !crypto.timingSafeEqual(storedBuf, codeBuf)) {
    throw new Error('Invalid code. Check WhatsApp and try again.');
  }

  await redis.del(otpKey(phone));
  return phone;
}

export { formatPhoneDisplay };
