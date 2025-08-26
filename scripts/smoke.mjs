// /scripts/smoke.mjs
// Smoke test เบาๆ ป้องกันพังซ้ำ: เช็ค meta/auto/rates, ค่าเรท, และสแกนหาชื่อต้องห้ามในโค้ด

import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const files = {
  meta:  path.join(root, 'public', 'catalog', 'meta.json'),
  auto:  path.join(root, 'public', 'catalog', 'auto.json'),
  rates: path.join(root, 'public', 'catalog', 'rates.json'),
};

function ok(m){ console.log('✔', m); }
function warn(m){ console.warn('⚠', m); }
function err(m){ console.error('✖', m); }

async function readJson(p) {
  const txt = await fs.readFile(p, 'utf8');
  return JSON.parse(txt);
}

async function scanCodeForBanned() {
  const banned = [
    'buildDisplayPrice',
    'applyUSDPolicyFromTHB',
    'applyUSDPolicyOnManualUSD'
  ];
  const ignoreDirs = new Set(['node_modules', '.next', '.git', '.vercel', 'dist', 'out', 'coverage']);
  let hits = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (ignoreDirs.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) { await walk(abs); continue; }
      if (!/\.(mjs|cjs|js|jsx|ts|tsx)$/.test(e.name)) continue;
      const txt = await fs.readFile(abs, 'utf8');
      banned.forEach(name => {
        if (txt.includes(name)) hits.push({ file: path.relative(root, abs), name });
      });
    }
  }
  await walk(root);
  return hits;
}

(async () => {
  try {
    // 1) meta.json
    const meta = await readJson(files.meta);
    if (!meta || typeof meta !== 'object') throw new Error('meta.json not object');
    ok('อ่าน meta.json ได้');

    // 2) auto.json
    const auto = await readJson(files.auto);
    if (!auto || !Array.isArray(auto.products)) throw new Error('auto.json ไม่มี products array');
    ok(`อ่าน auto.json ได้ (${auto.products.length} รายการ)`);

    // 3) rates.json
    const rates = await readJson(files.rates);
    if (typeof rates.THB_USD !== 'number' || !(rates.THB_USD > 0)) throw new Error('rates.THB_USD ไม่ถูกต้อง');
    if (!rates.updatedAt) warn('rates.updatedAt ว่าง (ควรมีวันที่อัปเดต)');
    ok(`อ่าน rates.json ได้ (THB_USD=${rates.THB_USD})`);

    // 4) ชื่อต้องห้ามในซอร์ส
    const hits = await scanCodeForBanned();
    if (hits.length) {
      console.log('──────── พบการใช้ชื่อต้องห้าม ────────');
      hits.forEach(h => console.log(`- ${h.name} @ ${h.file}`));
      throw new Error('พบชื่อต้องห้ามในโค้ด');
    }
    ok('ไม่พบชื่อต้องห้ามในซอร์ส');

    console.log('────────────────────────────────────────');
    ok('SMOKE: PASS');
    process.exit(0);
  } catch (e) {
    console.log('────────────────────────────────────────');
    err(`SMOKE: FAIL → ${e.message}`);
    process.exit(1);
  }
})();
