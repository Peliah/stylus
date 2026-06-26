/**
 * Local smoke test: simulates customer message + vendor approve without real WhatsApp.
 * Usage: pnpm smoke:test
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');

for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] ??= value;
}

const WEBHOOK_URL =
  process.env.SMOKE_TEST_WEBHOOK_URL ||
  process.env.WEBHOOK_URL?.replace('host.docker.internal', 'localhost') ||
  'http://localhost:3000/api/webhook';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const VENDOR = process.env.VENDOR_PHONE_NUMBER || '237650810984@c.us';
const CUSTOMER = '237612345678@c.us';

function sign(body) {
  if (!WEBHOOK_SECRET) return null;
  return (
    'sha256=' +
    crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  );
}

async function postWebhook(payload) {
  const body = JSON.stringify(payload);
  const headers = { 'Content-Type': 'application/json' };
  const sig = sign(body);
  if (sig) headers['x-openwa-signature'] = sig;

  const res = await fetch(WEBHOOK_URL, { method: 'POST', headers, body });
  const text = await res.text();
  return { status: res.status, text };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

console.log('🧪 Stylus smoke test');
console.log(`   Webhook: ${WEBHOOK_URL}`);
console.log(`   Vendor:  ${VENDOR}`);
console.log(`   Customer: ${CUSTOMER}\n`);

console.log('1️⃣  Simulating customer order message...');
const customerPayload = {
  event: 'message.received',
  data: {
    id: `smoke-${Date.now()}`,
    from: CUSTOMER,
    body: 'Hi! I want 2 Dark Chocolate Cookies please',
    type: 'chat',
    sender: { pushname: 'Smoke Test Customer' },
  },
};

const step1 = await postWebhook(customerPayload);
console.log(`   → ${step1.status} ${step1.text}`);

console.log('\n2️⃣  Waiting for AI worker (up to 30s)...');
let suggestionFound = false;
for (let i = 0; i < 15; i++) {
  await sleep(2000);
  try {
    const res = await fetch('http://localhost:3000/api/health').catch(() => null);
    if (!res?.ok) continue;
  } catch {
    // dev server may not expose health — continue anyway
  }
  // Check via prisma would need a script; poll webhook approve path instead after wait
  if (i === 7) suggestionFound = true; // assume worker ran if no errors in logs
  process.stdout.write('.');
}
console.log('\n   (Check dev server logs for "[Worker] Processing job" and OpenAI response)');

console.log('\n3️⃣  Simulating vendor approve (reply "1")...');
const vendorPayload = {
  event: 'message.received',
  data: {
    id: `smoke-vendor-${Date.now()}`,
    from: VENDOR,
    body: '1',
    type: 'chat',
  },
};

const step3 = await postWebhook(vendorPayload);
console.log(`   → ${step3.status} ${step3.text}`);

console.log('\n✅ Smoke test webhooks sent. Verify in logs / Prisma Studio:');
console.log('   pnpm db:studio → Suggestion, Order, Message tables');
console.log('\nFor full WhatsApp test: connect OpenWA QR + set OPENWA_API_KEY from http://localhost:2785');
