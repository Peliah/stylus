/**
 * Start OpenWA default session and print QR link (uses .env, does not print API key).
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
const key = process.env.OPENWA_API_KEY || '';
const session = process.env.OPENWA_SESSION_ID || 'default';

async function api(method, urlPath, body) {
  const res = await fetch(`${base}${urlPath}`, {
    method,
    headers: {
      'X-API-Key': key,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
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

// Ensure session exists
let r = await api('GET', `/api/sessions/${session}`);
if (r.status === 404) {
  r = await api('POST', '/api/sessions', { name: 'stylus-vendor' });
  console.log('Created session:', r.status, r.json.message || r.json.id || '');
}

r = await api('POST', `/api/sessions/${session}/start`);
console.log('Start session:', r.status, r.json.message || r.json.status || '');

r = await api('GET', `/api/sessions/${session}/qr`);
if (r.json?.qr || r.json?.qrCode) {
  console.log('\n📱 Scan QR with WhatsApp on +237650810984');
  console.log(`   Dashboard: ${base}/\n`);
} else {
  console.log('QR status:', r.status, JSON.stringify(r.json).slice(0, 300));
}

r = await api('GET', `/api/sessions/${session}`);
console.log('Session status:', r.json.status || r.json);
