import React from "react";
import { motion } from "framer-motion";
import { products as catalog } from "../lib/catalog";

export default function SoraAIPromptStore() {
  // ---- Catalog (Edit to manage products) ----
  const products = catalog;

  const categories = [
    "ทั้งหมด",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  // ---- UI State ----
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("ทั้งหมด");
  const [sort, setSort] = React.useState("popular");
  const [modal, setModal] = React.useState(null); // product id
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", dark);
    }
  }, [dark]);

  const filtered = products
    .filter(
      (p) =>
        (cat === "ทั้งหมด" || p.category === cat) &&
        (p.title.toLowerCase().includes(q.toLowerCase()) ||
          p.tagline.toLowerCase().includes(q.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return b.sales - a.sales; // popular
    });

  // ---- Helpers ----
  const Currency = ({ value }) => (
    <span className="tabular-nums">
      {value.toLocaleString("th-TH", { style: "currency", currency: "THB" })}
    </span>
  );

  const Badge = ({ children }) => (
    <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-800">
      {children}
    </span>
  );

  const Stat = ({ label, value }) => (
    <div className="flex flex-col text-center p-4 rounded-2xl bg-white/50 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );

  const ProductCard = ({ p }) => (
    <motion.div
      whileHover={{ y: -3 }}
      className="group rounded-2xl overflow-hidden bg-white ring-1 ring-gray-200 hover:ring-gray-300 shadow-sm hover:shadow-md transition dark:bg-gray-900 dark:ring-white/10"
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={p.image}
          alt={p.title}
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold leading-tight text-gray-900 dark:text-gray-100">
            {p.title}
          </h3>
          <Badge>{p.level}</Badge>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
          {p.tagline}
        </p>
        <div className="flex items-baseline gap-2">
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            <Currency value={p.price} />
          </div>
          <div className="text-sm line-through text-gray-400">
            <Currency value={p.originalPrice} />
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>⭐ {p.rating}</span>
          <span>•</span>
          <span>{p.sales.toLocaleString()} ซื้อแล้ว</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.includes.slice(0, 3).map((x) => (
            <span
              key={x}
              className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs dark:bg-white/5 dark:text-gray-300"
            >
              {x}
            </span>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setModal(p.id)}
            className="flex-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-100"
          >
            รายละเอียด
          </button>
          <a
            href={`/pay?pid=${p.id}`}
            className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-center"
          >
            ซื้อทันที
          </a>
        </div>
      </div>
    </motion.div>
  );

  const Modal = ({ product, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-auto rounded-3xl bg-white shadow-2xl overflow-hidden dark:bg-gray-950">
        <div className="grid md:grid-cols-2">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-56 md:h-full object-cover"
          />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold dark:text-gray-100">
                {product.title}
              </h3>
              <Badge>{product.level}</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{product.tagline}</p>
            <div className="flex flex-wrap gap-2">
              {product.includes.map((x) => (
                <span
                  key={x}
                  className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs dark:bg-white/5 dark:text-gray-300"
                >
                  {x}
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ไฟล์ที่ได้รับ: {product.files.join(" ")}
            </div>
            <div className="flex items-baseline gap-3 pt-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                <Currency value={product.price} />
              </div>
              <div className="text-sm line-through text-gray-400">
                <Currency value={product.originalPrice} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <a
                href={`/pay?pid=${product.id}`}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-center"
              >
                ซื้อทันที
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium dark:bg:white/10 dark:hover:bg-white/20 dark:text-gray-100"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const activeProduct = modal ? products.find((x) => x.id === modal) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 dark:text-gray-100">
      {/* SEO / JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: 'SoraAI Prompt Store',
            url: 'https://example.com',
            sameAs: ['https://github.com/Jacknarak/SoraAI'],
            offers: products.map((p) => ({
              '@type': 'Offer',
              name: p.title,
              price: p.price,
              priceCurrency: 'THB',
              url: `/pay?pid=${p.id}`,
            })),
          }),
        }}
      />

      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b border-black/5 dark:supports-[backdrop-filter]:bg-gray-950/60 dark:bg-gray-950/80">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">
              S
            </div>
            <div className="font-semibold">SoraAI Prompt Store</div>
          </div>
          <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <a href="#catalog" className="hover:text-gray-900 dark:hover:text-white">
              สินค้า
            </a>
            <a href="#videos" className="hover:text-gray-900 dark:hover:text-white">
              วิดีโอ
            </a>
            <a href="#roadmap" className="hover:text-gray-900 dark:hover:text-white">
              Roadmap
            </a>
            <a href="#faq" className="hover:text-gray-900 dark:hover:text-white">
              คำถามที่พบบ่อย
            </a>
          </nav>
          <div className="ml-auto md:ml-0 flex items-center gap-2">
            <button
              onClick={() => setDark((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium dark:bg-white/10 dark:hover:bg-white/20"
            >
              {dark ? 'Light' : 'Dark'}
            </button>
            <a
              href="#contact"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
            >
              ติดต่อเรา
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium dark:bg-indigo-900/40 dark:text-indigo-200">
                <span className="h-2 w-2 rounded-full bg-indigo-600" /> แพลตฟอร์มครีเอเตอร์สาย AI
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-5xl font-extrabold leading-tight"
            >
              ร้านขาย <span className="text-indigo-600">Prompt</span> & ระบบสร้างงานอัตโนมัติ
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 text-lg dark:text-gray-300"
            >
              รวมชุดคำสั่งคุณภาพสูงสำหรับธุรกิจ เนื้อหา และครีเอทีฟ พร้อมเวิร์กโฟลว์อัตโนมัติที่เชื่อมต่อ GitHub, Google Sheets, Render ได้จริง
            </motion.p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#catalog"
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-center"
              >
                ดูสินค้าทั้งหมด
              </a>
              <a
                href="#newsletter"
                className="px-5 py-3 rounded-2xl bg-gray-900/90 hover:bg-gray-900 text-white font-semibold text-center"
              >
                รับอัปเดต/ของฟรี
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              <Stat label="ลูกค้า" value="3,000+" />
              <Stat label="เรตติ้งเฉลี่ย" value="4.9/5" />
              <Stat label="อัปเดต/ปี" value="50+" />
            </div>
            <div className="flex items-center gap-6 pt-4 opacity-80">
              {[
                "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?q=80&w=1200&auto=format&fit=crop",
              ].map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`partner-${i}`}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white/60"
                />
              ))}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ผู้ใช้จากทีมครีเอทีฟ/สตาร์ทอัปทั่วเอเชีย
              </div>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop"
                alt="SoraAI"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 p-4 text-sm dark:bg-gray-900 dark:ring-white/10">
              <div className="font-semibold">เชื่อมระบบอัตโนมัติ</div>
              <div className="text-gray-600 dark:text-gray-400">GitHub • Google Sheets • Render</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHY FOLLOW */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              t: "แนวคิดลึก ใช้ได้จริง",
              s: "Framework + Prompt ที่พิสูจน์แล้วในโปรเจกต์จริง",
            },
            {
              t: "อัตโนมัติทั้งสโคป",
              s: "ตัวอย่างเวิร์กโฟลว์ เชื่อม GitHub / Render / Sheets",
            },
            { t: "เรียนรู้แบบก้าวกระโดด", s: "วิดีโอสั้น + เคสสตาดี + โค้ดจริง" },
          ].map((x) => (
            <div key={x.t} className="p-6 rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
              <div className="text-lg font-semibold mb-1">{x.t}</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">{x.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTROLS */}
      <section id="catalog" className="mx-auto max-w-7xl px-4 pb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-xl border text-sm ${
                  cat === c
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:border-white/10 dark:hover:border-white/20"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาสินค้า…"
                className="w-64 px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-white/10 dark:placeholder:text-gray-400"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:border-white/10"
            >
              <option value="popular">เรียงตามยอดนิยม</option>
              <option value="price-asc">ราคาต่ำ → สูง</option>
              <option value="price-desc">ราคาสูง → ต่ำ</option>
              <option value="rating">เรตติ้งสูงสุด</option>
            </select>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* VIDEO CONTENT */}
      <section id="videos" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">วิดีโอสอนสั้น / เดโม</h2>
          <p className="text-gray-600 dark:text-gray-400">อัปเดตเนื้อหาเป็นตอน ๆ สำหรับผู้สนใจ AI & Automation</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {["dQw4w9WgXcQ", "ysz5S6PUM-U", "aqz-KE-bpKQ"].map((id) => (
            <div key={id} className="rounded-2xl overflow-hidden ring-1 ring-gray-200 bg-white dark:bg-gray-900 dark:ring-white/10">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${id}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 text-sm text-gray-700 dark:text-gray-300">พรีวิว/เดโมเวิร์กโฟลว์และพรอมป์ทจริง</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROADMAP / CHANGELOG */}
      <section id="roadmap" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Roadmap & Changelog</h2>
          <p className="text-gray-600 dark:text-gray-400">ติดตามพัฒนาการและสิ่งที่จะปล่อยในอนาคตอันใกล้</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
            <div className="font-semibold mb-2">ถัดไป</div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• PromptPack: "AI Video Scripts 100 แบบ"</li>
              <li>• Engine: Resume/NFT/Picture Modules</li>
              <li>• ชำระเงิน: Stripe + PromptPay + LINE OA</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
            <div className="font-semibold mb-2">อัปเดตล่าสุด</div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• เปิดร้าน SoraAI Prompt Store (v1)</li>
              <li>• เพิ่มวิดีโอเดโม & หน้าตั้งค่า Dark Mode</li>
              <li>• ปรับปรุง UI การค้นหา กรอง เรียงสินค้า</li>
            </ul>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section id="newsletter" className="mx-auto max-w-7xl px-4 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-500 p-6 md:p-10 text-white">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-2xl font-semibold mb-1">เข้าร่วมรายชื่ออัปเดต</div>
              <div className="opacity-90">รับข่าวของฟรี เทคนิค และโค้ดใหม่ก่อนใคร</div>
            </div>
            <form className="flex gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="อีเมลของคุณ"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900"
              />
              <button className="px-5 py-3 rounded-xl bg-black/80 hover:bg-black font-semibold">
                สมัคร
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">แพ็กเกจสำหรับทีม/องค์กร</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: 0,
              features: ["สินค้าฟรีเมื่อมี", "อัปเดตข่าวสาร", "ชุมชนผู้ใช้"],
              cta: "เริ่มฟรี",
            },
            {
              name: "Pro",
              price: 1490,
              features: [
                "Prompt Pack 1 รายการ",
                "อัปเดต 6 เดือน",
                "ซัพพอร์ตอีเมล",
              ],
              cta: "เลือก Pro",
            },
            {
              name: "Elite",
              price: 4990,
              features: [
                "เข้าถึงสินค้าทั้งร้าน 1 เดือน",
                "อัปเดต 12 เดือน",
                "ที่ปรึกษา 1 ชม.",
              ],
              cta: "เลือก Elite",
            },
          ].map((t, i) => (
            <div
              key={t.name}
              className={`rounded-3xl ring-1 ring-gray-200 p-6 bg-white dark:bg-gray-900 dark:ring-white/10 ${
                i === 1 ? "border-2 border-indigo-600 shadow-xl" : ""
              }`}
            >
              <div className="flex items-baseline justify-between">
                <div className="text-xl font-bold">{t.name}</div>
                {i === 1 && <Badge>แนะนำ</Badge>}
              </div>
              <div className="text-3xl font-extrabold py-3">
                {t.price
                  ? t.price.toLocaleString("th-TH", {
                      style: "currency",
                      currency: "THB",
                    })
                  : "ฟรี"}
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#checkout"
                className={`mt-6 block text-center px-4 py-2 rounded-xl font-semibold ${
                  i === 1
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-900/90 text-white hover:bg-gray-900"
                }`}
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">คำถามที่พบบ่อย</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              q: "จะได้รับไฟล์อะไรหลังชำระเงิน?",
              a: "ลูกค้าจะได้รับไฟล์ตามที่ระบุในแต่ละสินค้า เช่น PDF/DOCX/MD รวมถึงลิงก์ GitHub (ถ้ามี) เพื่อยืนยันไฟล์จริง 100%",
            },
            {
              q: "ขอใบเสร็จ/ออกเอกสารได้หรือไม่?",
              a: "ได้ เราสามารถออกเอกสาร/ใบกำกับอย่างไม่เป็นทางการให้หลังการสั่งซื้อ",
            },
            {
              q: "มีอัปเดตฟรีหรือไม่?",
              a: "มีตามระยะเวลาที่ระบุในรายละเอียดสินค้า (เช่น 3–12 เดือน)",
            },
            {
              q: "ขอปรับแต่งให้เข้ากับงานเราได้ไหม?",
              a: "ได้ แนะนำบริการ Custom Prompt + Integration เพื่อปรับให้เหมาะกับธุรกิจของคุณ",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="p-6 rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10"
            >
              <div className="font-semibold mb-2">{item.q}</div>
              <div className="text-gray-600 text-sm dark:text-gray-400">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-7xl px-4 pb-24">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-bold">ต้องการเดโมหรือใบเสนอราคา?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              ทักหาเราเพื่อรับเดโม/ลิงก์ชำระเงินจริง (Stripe/PromptPay/LINE OA)
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <a
              href="#line"
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              แชทผ่าน LINE OA
            </a>
            <a
              href="#github"
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold"
            >
              ดูตัวอย่างบน GitHub
            </a>
            <a
              href="#email"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              อีเมลทีมงาน
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/5 py-10 text-sm text-gray-600 dark:text-gray-400 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-0 md:justify-between">
          <div className="space-y-2 text-center md:text-left">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              SoraAI Prompt Store
            </div>
            <div>© {new Date().getFullYear()} SoraAI. สงวนลิขสิทธิ์</div>
          </div>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-gray-900 dark:hover:text-white">
              Privacy
            </a>
            <a href="#terms" className="hover:text-gray-900 dark:hover:text-white">
              Terms
            </a>
            <a href="#refund" className="hover:text-gray-900 dark:hover:text-white">
              Refund
            </a>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      {activeProduct && (
        <Modal
          product={activeProduct}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
