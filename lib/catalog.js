// /lib/catalog.js
// โหลดและรวม meta.json + auto.json + อัตราแลกเปลี่ยน (rates.json)
// NOTE: ลบ helper ต้องห้าม (buildDisplayPrice, applyUSDPolicyFromTHB, applyUSDPolicyOnManualUSD)
//       เพิ่ม computeUSDFromTHBWithPolicy เป็นแหล่งความจริงของนโยบาย USD (ข้อ 5A)

let _cache = null;

// อ่านไฟล์ใต้ public ทั้งฝั่ง server (fs) และ client (fetch)
async function loadJsonPublic(relPath) {
  if (typeof window === 'undefined') {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', relPath);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  try {
    const res = await fetch('/' + relPath, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ===== FX / Rates =====
export async function getRates() {
  const rates = await loadJsonPublic('catalog/rates.json');
  if (rates && typeof rates.THB_USD === 'number') return rates;
  return { source: 'fallback', THB_USD: 0.028, updatedAt: null };
}

export function formatTHB(amount) {
  try {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
  } catch { return `฿${amount}`; }
}
export function formatUSD(amount) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  } catch { return `$${Number(amount).toFixed(2)}`; }
}

export function convertTHBtoUSD(thb, rates) {
  const fx = Number(rates?.THB_USD) || 0.028;
  return Number((Number(thb) * fx).toFixed(2));
}
export function convertUSDtoTHB(usd, rates) {
  const fx = Number(rates?.THB_USD) || 0.028;
  if (!fx) return 0;
  return Math.round(Number(usd) / fx);
}

/**
 * computeUSDFromTHBWithPolicy
 * แปลง THB → USD + policy margin/flat/min + ปัดเศษ "ceil to *.99" (ค่าเริ่มต้น)
 * ใช้เพื่อ "ราคาที่แสดงผล" เท่านั้น ไม่กระทบข้อมูลดิบ
 */
export function computeUSDFromTHBWithPolicy(
  thb,
  rates,
  options = {}
) {
  if (typeof thb !== 'number' || !isFinite(thb) || thb < 0) {
    throw new Error('computeUSDFromTHBWithPolicy: invalid THB input');
  }
  if (!rates || typeof rates.THB_USD !== 'number' || !isFinite(rates.THB_USD)) {
    throw new Error('computeUSDFromTHBWithPolicy: missing rates.THB_USD');
  }
  const {
    marginPct = 0,
    flatUSD = 0,
    minUSD = 0,
    roundingMode = 'ceilPoint99',
  } = options;

  // 1) base conversion
  const baseUSD = thb * Number(rates.THB_USD);

  // 2) margin & flat
  let priced = baseUSD * (1 + (marginPct || 0)) + (flatUSD || 0);

  // 3) min floor
  if (minUSD && priced < minUSD) priced = minUSD;

  // 4) rounding
  let rounded = priced;
  if (roundingMode === 'ceilPoint99') {
    const intPart = Math.floor(priced);
    const target = intPart + 0.99;
    const eps = 1e-9;
    rounded = (priced <= target + eps) ? target : (intPart + 1 + 0.99);
    rounded = Number(rounded.toFixed(2));
  } else if (roundingMode === 'none') {
    rounded = Number(priced.toFixed(2));
  } else {
    throw new Error(`Unknown roundingMode: ${roundingMode}`);
  }

  return {
    usd: rounded,
    isDerivedUSD: true,
    rate: Number(rates.THB_USD),
    rateUpdatedAt: rates.updatedAt || null,
    policy: { marginPct, flatUSD, minUSD, roundingMode },
  };
}

// ===== Types / Labels =====
export const PRODUCT_TYPES = ['Prompt', 'Ebook', 'Image', 'Video', 'NFT', 'Other'];

export function normalizeType(t) {
  const s = String(t || '').trim().toLowerCase();
  if (s === 'prompt') return 'Prompt';
  if (s === 'ebook' || s === 'e-book' || s === 'book') return 'Ebook';
  if (s === 'image' || s === 'photo' || s === 'picture') return 'Image';
  if (s === 'video' || s === 'clip') return 'Video';
  if (s === 'nft') return 'NFT';
  return 'Other';
}
export const typeKey = normalizeType;

export function typeLabel(t) {
  // แสดงเป็นอังกฤษตามชีต
  return normalizeType(t);
}

export const TYPE_ENUM = ['Prompt', 'Ebook', 'Image', 'Video', 'NFT', 'Other'];
export function canonicalTypeName(s = '') { return normalizeType(s); }
export function typeDisplay(product) { return normalizeType(product?.type || ''); }

// ===== Merge / Sanitize =====
function mergeProducts(autoList = [], manualList = []) {
  const map = new Map();
  for (const p of autoList) map.set(p.id || p.sku, p);
  for (const p of manualList) {
    const key = p.id || p.sku;
    map.set(key, { ...map.get(key), ...p }); // meta.json override auto.json
  }
  return Array.from(map.values());
}
function sanitizeIncludes(val) {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    return val.split(/[\|\n,]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}
function sanitizeProduct(p = {}) {
  const out = { ...p };
  out.id = out.id || out.sku || '';
  out.sku = out.sku || out.id;
  out.type = normalizeType(out.type || 'Prompt');
  out.priceTHB = Number(out.priceTHB || 0);
  out.priceUSD = Number(out.priceUSD || 0);
  out.rating = Number(out.rating || 5);
  out.sales  = Number(out.sales  || 0);
  out.includes = sanitizeIncludes(out.includes);
  return out;
}

// ===== Catalog =====
export async function getCatalog() {
  if (_cache) return _cache;
  const [manual, auto] = await Promise.all([
    loadJsonPublic('catalog/meta.json'),
    loadJsonPublic('catalog/auto.json'),
  ]);

  const manualSafe = manual || { store: { name: 'InkChain AI Store', currency: 'THB' }, products: [], videos: [], posts: [] };
  const autoSafe   = auto   || { products: [] };

  const merged = mergeProducts(
    (autoSafe.products || []).map(sanitizeProduct),
    (manualSafe.products || []).map(sanitizeProduct)
  );

  _cache = {
    store: manualSafe.store || { name: 'InkChain AI Store', currency: 'THB' },
    products: merged,
    videos: manualSafe.videos || [],
    posts: manualSafe.posts || [],
  };
  return _cache;
}

export function clearCatalogCache() { _cache = null; }

export async function getProductById(idOrSku) {
  const catalog = await getCatalog();
  return catalog.products.find(p => p.id === idOrSku || p.sku === idOrSku) || null;
}

export function resolveDownloadTarget(product) {
  if (!product) return { href: '', external: false };
  if (product.type === 'NFT' && product.nftUrl) return { href: product.nftUrl, external: true };
  const href = product.file || '';
  return { href, external: /^https?:\/\//i.test(href) };
}

// ===== YouTube helper =====
export function youTubeIdFromUrl(url = '') {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || '';
    return '';
  } catch { return ''; }
}
export function youTubeThumb(url = '', quality = 'hqdefault') {
  const id = youTubeIdFromUrl(url);
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : '';
}
