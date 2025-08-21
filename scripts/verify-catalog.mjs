// /scripts/verify-catalog.mjs
// ดึง Google Sheet (CSV) + สแกน /public/products/** + จัดรูปเป็น public/catalog/auto.json
// จากนั้นตรวจความครบถ้วน (images/files) และสรุปผล
import fs from 'fs/promises';
import path from 'path';

const STRICT = process.argv.includes('--strict');
const SHEET_CSV_URL = process.env.SHEET_CSV_URL || ''; // แนะนำใส่ใน .env.local
const root = process.cwd();
const metaPath = path.join(root, 'public', 'catalog', 'meta.json');
const autoPath = path.join(root, 'public', 'catalog', 'auto.json');
const imagesRoot = path.join(root, 'public', 'images');
const productsRoot = path.join(root, 'public', 'products');

let WARN = 0, ERR = 0;
const ok   = m => console.log('✔︎', m);
const warn = m => { WARN++; console.warn('⚠︎', m); };
const err  = m => { ERR++; console.error('✖', m); };

const POSIX = p => p.replace(/\\/g, '/');
const extOf = (name='') => { const i = name.lastIndexOf('.'); return i>=0 ? name.slice(i).toLowerCase() : ''; };
const isHttp = (s='') => /^https?:\/\//i.test(s);

const TYPE_DIR = {
  Prompt: 'prompts',
  Ebook:  'ebooks',
  Image:  'images',
  Video:  'videos',
  NFT:    'nfts',
  Other:  '',
};
const TYPE_ORDER_EXT = {
  Prompt: ['.zip', '.pdf', '.md'],
  Ebook:  ['.pdf', '.epub', '.zip'],
  Image:  ['.zip', '.png', '.jpg', '.jpeg', '.webp'],
  Video:  ['.zip', '.mp4', '.mov', '.mkv'],
  Other:  ['.zip', '.pdf'],
};

async function listFilesRec(dir, relBase = '') {
  const out = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const rel = path.posix.join(relBase, e.name);
      if (e.isDirectory()) out.push(...await listFilesRec(abs, rel));
      else out.push(POSIX(rel));
    }
  } catch {}
  return out;
}

function parseCSV(text) {
  // พาร์ส CSV แบบรองรับ "ค่า,ที่มี,คอมมา" และการ escape "" ภายใน
  const rows = [];
  let i = 0, cur = '', inQ = false, row = [];
  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i+1] === '"') { cur += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      cur += ch; i++; continue;
    } else {
      if (ch === '"') { inQ = true; i++; continue; }
      if (ch === ',') { row.push(cur.trim()); cur=''; i++; continue; }
      if (ch === '\n') { row.push(cur.trim()); rows.push(row); cur=''; row=[]; i++; continue; }
      if (ch === '\r') { i++; continue; }
      cur += ch; i++; continue;
    }
  }
  row.push(cur.trim()); rows.push(row);
  // map to objects using header
  const header = rows.shift() || [];
  const objs = rows.filter(r => r.some(x => x && x.length)).map(r => {
    const o = {}; header.forEach((h, idx) => o[h.trim()] = (r[idx] ?? '').trim()); return o;
  });
  return objs;
}

function detectTypeFromFolder(rel) {
  const top = POSIX(rel).split('/')[0]?.toLowerCase();
  if (top === 'prompts') return 'Prompt';
  if (top === 'ebooks')  return 'Ebook';
  if (top === 'images')  return 'Image';
  if (top === 'videos')  return 'Video';
  if (top === 'nfts')    return 'NFT';
  return 'Prompt';
}

async function pickCoverPath(id, sheetImage) {
  if (sheetImage) {
    const custom = sheetImage.startsWith('/images/') ? sheetImage : `/images/${sheetImage}`;
    try { await fs.access(path.join(root, 'public', custom.replace(/^\//,''))); return custom; } catch {}
  }
  const candidates = [`${id}-cover.webp`, `${id}.webp`, `${id}.jpg`, `${id}.png`];
  for (const name of candidates) {
    try { await fs.access(path.join(imagesRoot, name)); return `/images/${name}`; } catch {}
  }
  return '';
}

function toBoolPublished(s) {
  const v = String(s || '').toLowerCase().trim();
  return v === '' || v === 'published' || v === 'true' || v === 'yes';
}

function parseIncludes(s) {
  if (!s) return [];
  return s.split(/;|\|/).map(x => x.trim()).filter(Boolean);
}

function parseNum(n, def=0) {
  const x = Number(String(n).replace(/[, ]/g, ''));
  return Number.isFinite(x) ? x : def;
}

async function buildFromSheet(csvUrl, productFilesIndex) {
  if (!csvUrl) {
    warn('ไม่ได้ตั้งค่า SHEET_CSV_URL — จะสร้างจากไฟล์ในโฟลเดอร์เท่านั้น');
    return [];
  }
  let text = '';
  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch (e) {
    err(`ดึง CSV ไม่ได้: ${e.message}`);
    return [];
  }
  const rows = parseCSV(text);
  if (!rows.length) { warn('CSV ว่างหรือไม่มีข้อมูล'); return []; }

  // Header ที่รองรับ: ID,Title,Type,Category,Level,PriceTHB,PriceUSD,Image,FileOverride,Gumroad,NFTUrl,Includes,Status,Sort
  const items = [];
  for (const r of rows) {
    const ID = (r.ID || r.Id || r.id || '').trim();
    if (!ID) continue;
    if (!toBoolPublished(r.Status)) continue;

    const Type = (r.Type || 'Prompt').trim();
    const Category = (r.Category || Type).trim();
    const Level = (r.Level || 'All').trim();
    const PriceTHB = parseNum(r.PriceTHB, 0);
    const PriceUSD = parseNum(r.PriceUSD, 0);
    const Image = (r.Image || '').trim();
    const FileOverride = (r.FileOverride || '').trim();
    const Gumroad = (r.Gumroad || '').trim();
    const NFTUrl = (r.NFTUrl || '').trim();
    const Includes = parseIncludes(r.Includes);
    const Sort = parseNum(r.Sort, 0);
    const Title = (r.Title || ID).trim();

    let image = await pickCoverPath(ID, Image);
    let file = '';
    let nftUrl = '';
    if (Type === 'NFT' && NFTUrl) {
      nftUrl = NFTUrl;
    } else if (FileOverride) {
      file = FileOverride.startsWith('/products/') ? FileOverride : `/products/${FileOverride.replace(/^\/+/,'')}`;
    } else {
      // หาไฟล์ที่ตรง ID จากดัชนี productFilesIndex
      const cand = (productFilesIndex.get(ID) || []);
      if (cand.length) {
        // เลือกจากลิสต์นามสกุลที่เหมาะกับ Type
        const pref = TYPE_ORDER_EXT[Type] || TYPE_ORDER_EXT.Other;
        const byPref = [...cand].sort((a,b) => (pref.indexOf(a.ext) - pref.indexOf(b.ext)));
        file = byPref[0]?.publicPath || '';
      } else {
        // เดาด้วย path ปริยาย
        const dir = TYPE_DIR[Type] || '';
        file = dir ? `/products/${dir}/${ID}.zip` : `/products/${ID}.zip`;
      }
    }

    items.push({
      id: ID, sku: ID, type: Type,
      title: Title, category: Category, level: Level,
      priceTHB: PriceTHB, priceUSD: PriceUSD,
      image, file, nftUrl,
      rating: 5, sales: 0,
      includes: Includes, gumroad: Gumroad,
      sort: Sort
    });
  }
  return items;
}

async function buildFileIndex() {
  // map: ID -> [{publicPath, ext, typeGuess}]
  const rels = await listFilesRec(productsRoot);
  const map = new Map();
  for (const rel of rels) {
    const posix = POSIX(rel);
    const base = posix.split('/').pop() || '';
    const id = base.replace(/\.[^.]+$/, '').split('__')[0].toUpperCase(); // รองรับชื่อไฟล์ pattern แบบก่อนหน้า
    const ext = extOf(base);
    const publicPath = `/products/${posix}`;
    const arr = map.get(id) || [];
    arr.push({ publicPath, ext, typeGuess: detectTypeFromFolder(posix) });
    map.set(id, arr);
  }
  return map;
}

(async () => {
  // 1) โหลด meta.json (เพื่อเตือนขั้นต่ำ)
  try {
    const raw = await fs.readFile(metaPath, 'utf8');
    JSON.parse(raw);
  } catch (e) {
    warn(`อ่าน meta.json ไม่ได้หรือ JSON ไม่สมบูรณ์: ${e.message}`);
  }

  // 2) สร้างดัชนีไฟล์จริงใน /public/products/**
  const fileIndex = await buildFileIndex();

  // 3) สร้างรายการจาก Google Sheet (ถ้าตั้งค่า URL) + สร้าง auto.json
  const autoProducts = await buildFromSheet(SHEET_CSV_URL, fileIndex);

  // 4) เติม fallback จากไฟล์ที่ไม่มีในชีต (optional; ให้โชว์ด้วยชื่อ ID ล้วน)
  for (const [id, files] of fileIndex.entries()) {
    if (autoProducts.find(p => p.id === id)) continue;
    const best = files[0];
    autoProducts.push({
      id, sku: id, type: best?.typeGuess || 'Prompt',
      title: id, category: best?.typeGuess || 'Other', level: 'All',
      priceTHB: 0, priceUSD: 0,
      image: await pickCoverPath(id, ''),
      file: best?.publicPath || '',
      nftUrl: '',
      rating: 5, sales: 0,
      includes: [], gumroad: '', sort: 0
    });
  }

  // 5) เขียน auto.json
  await fs.mkdir(path.dirname(autoPath), { recursive: true });
  await fs.writeFile(autoPath, JSON.stringify({ generatedAt: new Date().toISOString(), products: autoProducts }, null, 2), 'utf8');
  ok(`สร้าง/อัปเดต catalog/auto.json (${autoProducts.length} รายการ)`);

  // 6) ตรวจรูป/ไฟล์ที่อ้างอิง
  let missingFiles = 0, missingImages = 0;
  for (const p of autoProducts) {
    if (p.type === 'NFT' && p.nftUrl) {
      // ok
    } else {
      if (!p.file) { warn(`สินค้า ${p.id} ไม่มี file (หรือ nftUrl)`); missingFiles++; }
      else {
        if (!isHttp(p.file)) {
          const abs = path.join(root, 'public', p.file.replace(/^\//,''));
          try { await fs.access(abs); } catch { warn(`ไม่พบไฟล์ของสินค้า ${p.id}: ${p.file}`); missingFiles++; }
        }
      }
    }
    if (p.image) {
      const absImg = path.join(root, 'public', p.image.replace(/^\//,''));
      try { await fs.access(absImg); } catch { warn(`ไม่พบรูปภาพของสินค้า ${p.id}: ${p.image}`); missingImages++; }
    }
  }

  // 7) เตือนรูปกำพร้า
  const imageNames = new Set(await listFilesRec(imagesRoot));
  const refImages = new Set(autoProducts.map(p => (p.image || '').split('/').pop()).filter(Boolean));
  for (const nm of imageNames) {
    if (!refImages.has(nm)) warn(`รูปใน /public/images ไม่ถูกอ้าง: ${nm}`);
  }

  // 8) QR
  try { await fs.access(path.join(root, 'public', 'qr-promptpay.png')); } catch { warn('ไม่พบ public/qr-promptpay.png'); }

  // 9) สรุปผล
  console.log('────────────────────────────────────────');
  if (ERR) { err(`สรุป: ${ERR} ข้อผิดพลาด, ${WARN} คำเตือน`); process.exit(1); }
  if (STRICT && WARN) { err(`สรุป: 0 ข้อผิดพลาด, ${WARN} คำเตือน (โหมด --strict ล้มเหลว)`); process.exit(1); }
  ok(`สรุป: 0 ข้อผิดพลาด, ${WARN} คำเตือน`);
  ok('ตรวจสอบเสร็จสิ้น');
  process.exit(0);
})();
