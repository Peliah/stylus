/**
 * Simulates a self-chat command via the configured WEBHOOK_URL (tunnel).
 * Usage: pnpm openwa:test-self-chat
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

const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const VENDOR = process.env.VENDOR_PHONE_NUMBER || '';

function sign(body) {
  return (
    'sha256=' +
    crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  );
}

async function postSelfChat(bodyText) {
  const payload = {
    event: 'message.sent',
    data: {
      id: `self-test-${Date.now()}-${bodyText.replace(/\W/g, '')}`,
      from: VENDOR,
      chatId: VENDOR,
      body: bodyText,
      type: 'chat',
      fromMe: true,
    },
  };
  const body = JSON.stringify(payload);
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-openwa-signature': sign(body),
    },
    body,
  });
  const text = await res.text();
  console.log(`${bodyText} → ${res.status} ${text}`);
}

console.log(`Testing self-chat via ${WEBHOOK_URL}\n`);
for (const cmd of ['stock', '/menu', '/help']) {
  await postSelfChat(cmd);
}
