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
const session = process.env.OPENWA_SESSION_ID || 'default';
const webhookUrl = process.env.WEBHOOK_URL || '';
const secret = process.env.WEBHOOK_SECRET || '';

if (!apiKey) {
  console.error('Missing OPENWA_API_KEY in .env — run: pnpm openwa:sync-key');
  process.exit(1);
}
if (!webhookUrl) {
  console.error('Missing WEBHOOK_URL in .env');
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

console.log(`Registering webhook for session: ${session}`);
console.log(`URL: ${webhookUrl}`);

// Remove existing webhooks for this URL (avoid duplicates)
const list = await api('GET', `/api/sessions/${session}/webhooks`);
const existing = Array.isArray(list.json) ? list.json : list.json?.data || [];
for (const wh of existing) {
  if (wh.url === webhookUrl) {
    console.log(`Removing existing webhook ${wh.id}...`);
    await api('DELETE', `/api/sessions/${session}/webhooks/${wh.id}`);
  }
}

const body = {
  url: webhookUrl,
  events: ['message.received', 'message.sent'],
  ...(secret ? { secret } : {}),
};

const created = await api('POST', `/api/sessions/${session}/webhooks`, body);
if (created.status >= 200 && created.status < 300) {
  console.log('✅ Webhook registered with secret from .env WEBHOOK_SECRET');
  console.log('   Restart pnpm dev, then test again in OpenWA dashboard.');
} else {
  console.error('❌ Failed:', created.status, JSON.stringify(created.json));
  process.exit(1);
}
