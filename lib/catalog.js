// /lib/catalog.js
// โหลดและรวม meta.json + auto.json + อัตราแลกเปลี่ยน (rates.json)

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
  // คาดหวังไฟล์: /public/catalog/rates.json (อัปเดตด้วย scripts/update-rates.mjs)
  const rates = await loadJsonPublic('catalog/rates.json');
  if (rates && typeof rates.THB_USD === 'number') return rates;
  // fallback หากยังไม่มีไฟล์
  return {
    source: 'fallback',
    THB_USD: 0.028,
    updatedAt: null,
    fxPolicy: {
      base: 'THB',
      usd: { marginPct: 0.06, flatUSD: 0.3, minUSD: 0, round: { mode: 'ceil-step', step: 0.5 }, applyOnManualUSD: false },
      thb: { round: { mode: 'none' } }
    }
  };
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

// ===== FX display builder =====
function roundUSD(value, rule) {
  const v = Number(value || 0);
  const r = rule || { mode: 'none' };
  if (r.mode === 'ceil-step') {
    const step = Number(r.step) || 0.5;
    return Math.ceil(v / step) * step;
  }
  if (r.mode === 'ceil-endswith-99') {
    const intPart = Math.floor(v);
    const cents = v - intPart;
    return (cents <= 0.99) ? intPart + 0.99 : intPart + 1 + 0.99;
  }
  return v;
}

function applyUSDPolicyFromTHB(priceTHB, rates) {
  const fx = Number(rates?.THB_USD) || 0.028;
  const cfg = rates?.fxPolicy?.usd || {};
  const marginPct = Number(cfg.marginPct || 0);
  const flatUSD   = Number(cfg.flatUSD || 0);
  const minUSD    = Number(cfg.minUSD || 0);

  let usd = Number(priceTHB) * fx;
  usd = usd * (1 + marginPct) + flatUSD;
  usd = Math.max(usd, minUSD);
  usd = roundUSD(usd, cfg.round);
  return Number(usd.toFixed(2));
}
function applyUSDPolicyOnManualUSD(priceUSD, rates) {
  const cfg = rates?.fxPolicy?.usd || {};
  const marginPct = Number(cfg.marginPct || 0);
  const flatUSD   = Number(cfg.flatUSD || 0);
  const minUSD    = Number(cfg.minUSD || 0);

  let usd = Number(priceUSD) * (1 + marginPct) + flatUSD;
  usd = Math.max(usd, minUSD);
  usd = roundUSD(usd, cfg.round);
  return Number(usd.toFixed(2));
}

// สร้างชุดราคาแสดงผลตามสกุลเงินที่เลือก + secondary เป็นอ้างอิง
export function buildDisplayPrice(product, currency = 'THB', rates) {
  const applyOnManualUSD = !!(rates?.fxPolicy?.usd?.applyOnManualUSD);
  const hasTHB = Number(product?.priceTHB) > 0;
  const hasUSD = Number(product?.priceUSD) > 0;

  if (currency === 'THB') {
    const thbMain = hasTHB
      ? Number(product.priceTHB)
      : (hasUSD ? convertUSDtoTHB(Number(product.priceUSD), rates) : null);

    let usdSecondary = null;
    let approx = false;

    if (hasUSD && !applyOnManualUSD) {
      usdSecondary = Number(product.priceUSD);
      approx = false;
    } else if (hasTHB) {
      usdSecondary = applyUSDPolicyFromTHB(Number(product.priceTHB), rates);
      approx = true;
    } else if (hasUSD && applyOnManualUSD) {
      usdSecondary = applyUSDPolicyOnManualUSD(Number(product.priceUSD), rates);
      approx = true;
    }

    return {
      main: { value: thbMain, currency: 'THB', formatted: thbMain != null ? formatTHB(thbMain) : '' },
      secondary: usdSecondary != null
        ? { value: usdSecondary, currency: 'USD', formatted: formatUSD(usdSecondary), approx, rateDate: rates?.updatedAt || null }
        : null
    };
  }

  // USD เป็นหลัก
  let usdMain = null;
  if (hasUSD && !applyOnManualUSD) {
    usdMain = Number(product.priceUSD);
  } else if (hasTHB) {
    usdMain = applyUSDPolicyFromTHB(Number(product.priceTHB), rates);
  } else if (hasUSD && applyOnManualUSD) {
    usdMain = applyUSDPolicyOnManualUSD(Number(product.priceUSD), rates);
  }

  const thbSecondary = hasTHB
    ? { value: Number(product.priceTHB), currency: 'THB', formatted: formatTHB(Number(product.priceTHB)), approx: false, rateDate: null }
    : (usdMain != null
        ? { value: convertUSDtoTHB(usdMain, rates), currency: 'THB', formatted: formatTHB(convertUSDtoTHB(usdMain, rates)), approx: true, rateDate: rates?.updatedAt || null }
        : null);

  return {
    main: { value: usdMain, currency: 'USD', formatted: usdMain != null ? formatUSD(usdMain) : '' },
    secondary: thbSecondary
  };
}
