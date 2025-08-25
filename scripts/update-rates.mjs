// /scripts/update-rates.mjs
// ดึงเรท THB->USD จาก Frankfurter แล้วอัปเดต public/catalog/rates.json
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RATES_PATH = path.join(ROOT, 'public', 'catalog', 'rates.json');
const FR_URL = 'https://api.frankfurter.app/latest?from=THB&to=USD';

function deepMerge(base = {}, patch = {}) {
  const out = { ...base };
  for (const k of Object.keys(patch || {})) {
    const v = patch[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = deepMerge(out[k] || {}, v);
    else out[k] = v;
  }
  return out;
}

async function main() {
  const res = await fetch(FR_URL);
  if (!res.ok) throw new Error(`Fetch Frankfurter failed: ${res.status}`);
  const data = await res.json();

  const thbUsd = Number(data?.rates?.USD);
  const date = data?.date; // YYYY-MM-DD
  if (!thbUsd || !date) throw new Error('Invalid response from Frankfurter');

  // โหลดไฟล์เดิม (เก็บ fxPolicy ที่ตั้งไว้)
  let existing = {};
  try {
    const raw = await fs.readFile(RATES_PATH, 'utf8');
    existing = JSON.parse(raw);
  } catch {}

  const next = deepMerge(existing, {
    source: 'frankfurter',
    THB_USD: thbUsd,
    updatedAt: `${date}T00:00:00Z`
  });

  await fs.mkdir(path.dirname(RATES_PATH), { recursive: true });
  await fs.writeFile(RATES_PATH, JSON.stringify(next, null, 2), 'utf8');

  console.log(`✔ Updated rates.json: THB_USD=${thbUsd} • date=${date}`);
}

main().catch(err => {
  console.error('✖ update-rates failed:', err.message);
  process.exit(1);
});
