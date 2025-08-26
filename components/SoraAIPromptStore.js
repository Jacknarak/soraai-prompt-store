// /components/SoraAIPromptStore.js
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';

import {
  getCatalog,
  formatTHB, formatUSD,
  youTubeThumb,
  PRODUCT_TYPES, typeLabel, typeDisplay,
  getRates,
  computeUSDFromTHBWithPolicy, // ใช้แทน buildDisplayPrice
} from '../lib/catalog';

function sortPriceTHB(product) {
  const v = Number(product?.priceTHB) || 0;
  return v;
}

export default function SoraAIPromptStore() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState('THB'); // 'THB' | 'USD'
  const [rates, setRates] = useState(null);

  // โหลดคาตาล็อก
  useEffect(() => {
    let on = true;
    getCatalog()
      .then((d) => on && setCatalog(d))
      .catch((e) => on && setError(e?.message || 'โหลดข้อมูลไม่สำเร็จ'));
    return () => { on = false; };
  }, []);

  // โหลดอัตราแลกเปลี่ยน
  useEffect(() => {
    let on = true;
    getRates()
      .then((r) => on && setRates(r))
      .catch(() => {}); // ถ้าโหลดเรทไม่ได้ หน้าเพจยังแสดง THB ได้
    return () => { on = false; };
  }, []);

  // sync currency กับ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inkchain:currency');
      if (saved === 'USD' || saved === 'THB') setCurrency(saved);
    } catch {}
  }, []);
  function toggleCurrency() {
    setCurrency(c => {
      const next = c === 'THB' ? 'USD' : 'THB';
      try { localStorage.setItem('inkchain:currency', next); } catch {}
      return next;
    });
  }

  const storeName = useMemo(() => catalog?.store?.name || 'InkChain AI Store', [catalog]);
  const products  = useMemo(() => catalog?.products || [], [catalog]);
  const videos    = useMemo(() => (catalog?.videos || []).slice(0, 6), [catalog]);
  const posts     = useMemo(() => (catalog?.posts  || []).slice(0, 6), [catalog]);
  const heroImage = products[0]?.image || '/images/P-001-cover.webp';

  // ===== ฟิลเตอร์และจัดเรียง =====
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');
  const [catFilter,  setCatFilter]  = useState('ทั้งหมด');
  const [query,      setQuery]      = useState('');
  const [sortKey,    setSortKey]    = useState('pop');

  const typeOptions = useMemo(() => {
    const present = new Set(products.map(p => (p.type || 'Prompt')));
    return ['ทั้งหมด', ...PRODUCT_TYPES.filter(t => present.has(t))];
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return ['ทั้งหมด', ...Array.from(set)];
  }, [products]);

  const stats = useMemo(() => {
    const totalSales = products.reduce((s, p) => s + (Number(p.sales) || 0), 0);
    const avgRating  = products.length
      ? (products.reduce((s, p) => s + (Number(p.rating) || 0), 0) / products.length).toFixed(1)
      : '5.0';
    return { customers: Math.max(totalSales, 3000), avgRating, updates: Math.max(products.length, 50) };
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (typeFilter !== 'ทั้งหมด') list = list.filter(p => (p.type || 'Prompt') === typeFilter);
    if (catFilter !== 'ทั้งหมด')  list = list.filter(p => p.category === catFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p => [p.title, p.category, p.sku].filter(Boolean)
        .some(t => String(t).toLowerCase().includes(q)));
    }
    switch (sortKey) {
      case 'priceAsc':  list.sort((a,b) => sortPriceTHB(a) - sortPriceTHB(b)); break;
      case 'priceDesc': list.sort((a,b) => sortPriceTHB(b) - sortPriceTHB(a)); break;
      case 'rating':    list.sort((a,b)=> (b.rating||0)-(a.rating||0)); break;
      default:          list.sort((a,b)=> (b.sales||0)-(a.sales||0));
    }
    return list;
  }, [products, typeFilter, catFilter, query, sortKey]);

  const jsonLd = useMemo(() => {
    const items = products.map(p => ({
      '@type': 'Product',
      name: p.title,
      sku: p.sku,
      category: p.category,
      image: p.image,
      offers: { '@type': 'Offer', priceCurrency: 'THB', price: p.priceTHB, availability: 'http://schema.org/InStock' }
    }));
    return { '@context': 'https://schema.org', '@type': 'Store', name: storeName, makesOffer: items };
  }, [storeName, products]);

  return (
    <>
      <Head>
        <title>{storeName} — Prompt Store & AI Hub</title>
        <meta name="description" content="รวม Prompt/Ebook/NFT/รูป/วิดีโอ พร้อมอัปเดตเทคโนโลยี AI แบบโหลดไว" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl h-14 px-4 flex items-center justify-between">
          <Link href="/" className="font-bold">{storeName}</Link>
          <nav className="hidden md:flex items-center gap-3 text-sm">
            <a href="#videos" className="hover:underline">วิดีโอ</a>
            <a href="#updates" className="hover:underline">อัปเดต AI</a>
            <a href="#products" className="hover:underline">สินค้า</a>
            <button onClick={toggleCurrency} className="ml-2 rounded-xl border px-3 py-1.5" title="สลับสกุลเงิน">
              {currency}
            </button>
            <Link href={`/pay?pid=${encodeURIComponent(products[0]?.id || 'P-001')}`}
                  className="rounded-xl bg-black text-white px-3 py-1.5">ซื้อทันที</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-b from-violet-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block rounded-full bg-violet-100 text-violet-700 text-xs px-2 py-1">
                Prompt + คอนเทนต์ AI แบบโหลดไว
              </span>
              <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight">
                เลือกซื้อได้หลายประเภท — Prompt, Ebook, NFT, รูป, วิดีโอ
              </h1>
              <p className="mt-3 text-gray-600">
                จัดไฟล์ให้ถูกโฟลเดอร์ → ระบบอ่านอัตโนมัติจาก <code>meta.json</code> แล้วแสดงในหน้าเดียว
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <Stat value={`${stats.customers.toLocaleString()}+`} label="ลูกค้า" />
                <Stat value={`${stats.avgRating}/5`} label="เรตติ้งเฉลี่ย" />
                <Stat value={`${stats.updates}+`} label="อัปเดต/แพ็ก" />
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden border">
              <img src={heroImage} alt="InkChain Hero" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      <section id="videos" className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold">วิดีโอแนะนำ</h2>
          <span className="text-sm text-gray-500">โชว์ปก + ชื่อ → คลิกไปยังต้นทาง</span>
        </div>
        {videos.length === 0 ? (
          <div className="text-gray-500 text-sm">ยังไม่เพิ่มวิดีโอ</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {videos.map(v => {
              const thumb = v.thumbnail || youTubeThumb(v.url, 'hqdefault');
              return (
                <a key={v.id || v.url} href={v.url} target="_blank" rel="noopener noreferrer"
                   className="group rounded-2xl border overflow-hidden hover:shadow-sm transition">
                  <div className="aspect-video w-full bg-gray-100">
                    {thumb ? <img src={thumb} alt={v.title} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full grid place-items-center text-xs text-gray-500">No thumbnail</div>}
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-gray-500">{v.source || v.platform || 'Video'}</div>
                    <div className="mt-1 font-medium group-hover:underline">{v.title}</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* NEWS */}
      <section id="updates" className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold">อัปเดตเทคโนโลยี AI</h2>
          <span className="text-sm text-gray-500">พาดหัว + คำโปรยสั้น ๆ</span>
        </div>
        {(catalog?.posts || []).length === 0 ? (
          <div className="text-gray-500 text-sm">ยังไม่เพิ่มข่าว/บทความ</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map(p => {
              const isExternal = !!p.externalUrl;
              const Card = (
                <>
                  <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden rounded-xl">
                    {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full grid place-items-center text-xs text-gray-500">No image</div>}
                  </div>
                  <div className="mt-3 text-sm text-gray-500">{p.source || 'Update'}</div>
                  <div className="mt-1 font-semibold">{p.title}</div>
                  {p.excerpt && <p className="mt-1 text-sm text-gray-600 line-clamp-3">{p.excerpt}</p>}
                </>
              );
              return isExternal ? (
                <a key={p.slug || p.externalUrl} href={p.externalUrl} target="_blank" rel="noopener noreferrer"
                   className="rounded-2xl border p-4 hover:shadow-sm transition block">{Card}</a>
              ) : (
                <Link key={p.slug} href={`/post/${encodeURIComponent(p.slug)}`}
                      className="rounded-2xl border p-4 hover:shadow-sm transition block">{Card}</Link>
              );
            })}
          </div>
        )}
      </section>

      {/* PRODUCTS */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-10">
        {/* แถวที่ 1: Type */}
        <div className="mb-3 flex flex-wrap gap-2">
          {typeOptions.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-sm rounded-xl border ${typeFilter === t ? 'bg-black text-white' : 'hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* แถวที่ 2: Category + Search + Sort */}
        <Toolbar
          categories={categories}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
          query={query}
          setQuery={setQuery}
          sortKey={sortKey}
          setSortKey={setSortKey}
        />

        {error ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        ) : !catalog ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">ไม่พบสินค้าที่ตรงกับตัวกรอง</div>
        ) : (
          <motion.div initial="hidden" animate="show"
            variants={{ hidden:{opacity:0,y:6}, show:{opacity:1,y:0, transition:{staggerChildren:0.06}} }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map(p => (
              <motion.div key={p.id} variants={{ hidden:{opacity:0,y:6}, show:{opacity:1,y:0} }}
                className="rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50">
                  <img src={p.image} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{p.title}</h3>
                    <span className="text-xs rounded-full bg-gray-900 text-white px-2 py-1">
                      {typeDisplay(p)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    {p.category} • ⭐ {p.rating} • {p.sales} sales
                  </p>

                  {/* ราคา (THB/USD + รองประมาณการ) */}
                  <PriceBlock p={p} currency={currency} rates={rates} />

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link href={`/pay?pid=${encodeURIComponent(p.id)}`}
                          className="rounded-xl bg-black text-white px-4 py-2 text-sm hover:bg-gray-800">
                      ซื้อทันที (PromptPay)
                    </Link>
                    {p.gumroad ? (
                      <a href={p.gumroad} target="_blank" rel="noopener noreferrer"
                         className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Buy on Gumroad</a>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} {storeName}</div>
          <div className="flex gap-4">
            <a href="#videos" className="hover:underline">วิดีโอ</a>
            <a href="#updates" className="hover:underline">อัปเดต AI</a>
            <a href="#products" className="hover:underline">สินค้า</a>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ===== ส่วนประกอบย่อย ===== */

function Toolbar({ categories, catFilter, setCatFilter, query, setQuery, sortKey, setSortKey }) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 text-sm rounded-xl border ${catFilter === c ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="ค้นหาสินค้า…"
               className="w-full md:w-80 rounded-xl border px-3 py-2 text-sm" />
        <select value={sortKey} onChange={(e)=>setSortKey(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="pop">ยอดนิยม</option>
          <option value="priceAsc">ราคาต่ำ→สูง</option>
          <option value="priceDesc">ราคาสูง→ต่ำ</option>
          <option value="rating">เรตติ้งสูงสุด</option>
        </select>
      </div>
    </div>
  );
}

function PriceBlock({ p, currency, rates }) {
  const thb = Number(p?.priceTHB) || 0;

  // USD (คำนวณจาก THB ตามนโยบาย)
  const usdDerived = (rates && thb > 0)
    ? computeUSDFromTHBWithPolicy(thb, rates, { marginPct: 0, flatUSD: 0, minUSD: 0, roundingMode: 'ceilPoint99' })
    : null;

  const rateNote = usdDerived?.rateUpdatedAt
    ? `• rate: ${new Intl.DateTimeFormat('th-TH',{dateStyle:'medium'}).format(new Date(usdDerived.rateUpdatedAt))}`
    : '';

  if (currency === 'USD') {
    return (
      <div className="mt-3">
        <div className="font-bold text-lg">
          {usdDerived ? `~${formatUSD(usdDerived.usd)}` : '—'}
          <span className="text-gray-400 font-normal"> / USD</span>
        </div>
        {usdDerived && (
          <div className="text-xs text-gray-500 mt-0.5">{rateNote}</div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="font-bold text-lg">
        {formatTHB(thb)} <span className="text-gray-400 font-normal">/ THB</span>
      </div>
      {!!usdDerived && (
        <div className="text-xs text-gray-500 mt-0.5">
          ≈ {formatUSD(usdDerived.usd)} {rateNote}
        </div>
      )}
    </>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border p-3 text-center">
      <div className="text-lg md:text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border p-4">
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="mt-4 h-5 w-3/4 bg-gray-200 rounded" />
          <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
          <div className="mt-6 h-10 bg-gray-200 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
