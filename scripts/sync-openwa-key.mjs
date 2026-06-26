/**
 * Sync OpenWA API key from Docker container into root .env (does not print the key).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');

const paths = ['/app/data/.api-key', '/data/.api-key'];
let key = '';

for (const containerPath of paths) {
  try {
    key = execSync(`docker exec crm-openwa cat ${containerPath}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (key) break;
  } catch {
    // try next path
  }
}

if (!key) {
  console.error(
    'Could not read OpenWA API key. Open http://localhost:2785 and paste the key into OPENWA_API_KEY in .env'
  );
  process.exit(1);
}

let env = fs.readFileSync(envPath, 'utf8');
if (/^OPENWA_API_KEY=/m.test(env)) {
  env = env.replace(/^OPENWA_API_KEY=.*/m, `OPENWA_API_KEY="${key}"`);
} else {
  env += `\nOPENWA_API_KEY="${key}"\n`;
}

fs.writeFileSync(envPath, env);
console.log('✅ OPENWA_API_KEY synced to .env — restart `pnpm dev` if it is running');
