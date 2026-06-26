import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redis } from './redis';

export const SETUP_COOKIE_NAME = 'stylus_setup';
const SETUP_TTL_SECONDS = 30 * 60;

export interface PendingSetup {
  setupId: string;
  openwaSessionId: string;
  connectedPhone: string | null;
  shopName: string | null;
  createdAt: string;
}

function setupKey(setupId: string) {
  return `setup:pending:${setupId}`;
}

export function createSetupId(): string {
  return crypto.randomUUID();
}

export async function savePendingSetup(setup: PendingSetup): Promise<void> {
  await redis.set(setupKey(setup.setupId), JSON.stringify(setup), 'EX', SETUP_TTL_SECONDS);
}

export async function getPendingSetup(setupId: string): Promise<PendingSetup | null> {
  const raw = await redis.get(setupKey(setupId));
  if (!raw) return null;
  return JSON.parse(raw) as PendingSetup;
}

export async function updatePendingSetup(
  setupId: string,
  patch: Partial<Pick<PendingSetup, 'connectedPhone' | 'shopName'>>
): Promise<PendingSetup | null> {
  const existing = await getPendingSetup(setupId);
  if (!existing) return null;
  const updated: PendingSetup = { ...existing, ...patch };
  await savePendingSetup(updated);
  return updated;
}

export async function deletePendingSetup(setupId: string): Promise<void> {
  await redis.del(setupKey(setupId));
}

export async function getSetupIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SETUP_COOKIE_NAME)?.value ?? null;
}

export function setupCookieOptions(setupId: string) {
  return {
    name: SETUP_COOKIE_NAME,
    value: setupId,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SETUP_TTL_SECONDS,
  };
}
