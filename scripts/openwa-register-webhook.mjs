/**
 * Register CRM webhook on OpenWA via API (includes secret — dashboard cannot set this).
 * Usage: pnpm openwa:register-webhook
 */
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

const base = process.env.OPENWA_API_URL || 'http://localhost:2785';
const apiKey = process.env.OPENWA_API_KEY || '';
const vendorPhone = (process.env.VENDOR_PHONE_NUMBER || '').replace(/@.*$/, '').replace(/\D/g, '');
const tunnelUrl = process.env.WEBHOOK_URL || '';
const secret = process.env.WEBHOOK_SECRET || '';

if (!apiKey) {
  console.error('Missing OPENWA_API_KEY in .env — run: pnpm openwa:sync-key');
  process.exit(1);
}

const headers = {
  'X-API-Key': apiKey,
  'Content-Type': 'application/json',
};

async function api(method, urlPath, body) {
  const res = await fetch(`${base}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function phoneMatch(stored, gateway) {
  const a = stored.replace(/\D/g, '');
  const b = gateway.replace(/\D/g, '');
  return a === b || a.endsWith(b) || b.endsWith(a);
}

const sessionsRes = await api('GET', '/api/sessions');
const sessions = Array.isArray(sessionsRes.json) ? sessionsRes.json : [];

let session = sessions.find(
  (s) =>
    (s.status === 'ready' || s.status === 'connected') &&
    s.phone &&
    vendorPhone &&
    phoneMatch(vendorPhone, s.phone)
);

if (!session && process.env.OPENWA_SESSION_ID) {
  session = sessions.find((s) => s.id === process.env.OPENWA_SESSION_ID);
}

if (!session) {
  console.error('No connected OpenWA session found for vendor phone. Scan QR first.');
  process.exit(1);
}

const urls = tunnelUrl ? [tunnelUrl] : [];

console.log(`Registering webhooks on session: ${session.id} (${session.name})`);
console.log(`Phone: +${session.phone}`);

const list = await api('GET', `/api/sessions/${session.id}/webhooks`);
const existing = Array.isArray(list.json) ? list.json : list.json?.data || [];
const registered = new Set(existing.map((wh) => wh.url));

for (const url of urls) {
  if (registered.has(url)) {
    console.log(`✓ Already registered: ${url}`);
    continue;
  }
  const body = {
    url,
    events: ['message.received', 'message.sent'],
    ...(secret ? { secret } : {}),
  };
  const created = await api('POST', `/api/sessions/${session.id}/webhooks`, body);
  if (created.status >= 200 && created.status < 300) {
    console.log(`✅ Registered: ${url}`);
  } else {
    console.error(`❌ Failed ${url}:`, created.status, JSON.stringify(created.json));
  }
}

console.log('\nRestart pnpm dev, then test self-chat commands: stock, /menu, /help');
