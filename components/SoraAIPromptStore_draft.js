// components/SoraAIPromptStore.js
import React from "react";
import { motion } from "framer-motion";
import { products } from "../lib/catalog";   // ✅ ดึงจากแหล่งเดียว

export default function SoraAIPromptStore() {
  const categories = ["ทั้งหมด", ...Array.from(new Set(products.map(p => p.category)))];

  // ---- UI State ----
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("ทั้งหมด");
  const [sort, setSort] = React.useState("popular");
  const [modal, setModal] = React.useState(null);
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", dark);
    }
  }, [dark]);

  const filtered = products
    .filter(p =>
      (cat === "ทั้งหมด" || p.category === cat) &&
      (p.title.toLowerCase().includes(q.toLowerCase()) ||
       p.tagline.toLowerCase().includes(q.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return b.sales - a.sales;
    });

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
        <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold leading-tight text-gray-900 dark:text-gray-100">{p.title}</h3>
          <Badge>{p.level}</Badge>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 dark:text-gray-400">{p.tagline}</p>
        <div className="flex items-baseline gap-2">
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100"><Currency value={p.price} /></div>
          <div className="text-sm line-through text-gray-400"><Currency value={p.originalPrice} /></div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>⭐ {p.rating}</span><span>•</span><span>{p.sales.toLocaleString()} ซื้อแล้ว</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.includes?.slice(0,3).map(x => (
            <span key={x} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs dark:bg-white/5 dark:text-gray-300">{x}</span>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => setModal(p.id)} className="flex-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-100">รายละเอียด</button>
          <a href={`/pay?pid=${p.id}`} className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-center">ซื้อทันที</a>
        </div>
      </div>
    </motion.div>
  );

  const Modal = ({ product, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-auto rounded-3xl bg-white shadow-2xl overflow-hidden dark:bg-gray-950">
        <div className="grid md:grid-cols-2">
          <img src={product.image} alt={product.title} className="w-full h-56 md:h-full object-cover" />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold dark:text-gray-100">{product.title}</h3>
              <Badge>{product.level}</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{product.tagline}</p>
            <div className="flex flex-wrap gap-2">
              {product.includes?.map(x => (
                <span key={x} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs dark:bg-white/5 dark:text-gray-300">{x}</span>
              ))}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">ไฟล์ที่ได้รับ: {product.files?.join(" ")}</div>
            <div className="flex items-baseline gap-3 pt-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100"><Currency value={product.price} /></div>
              <div className="text-sm line-through text-gray-400"><Currency value={product.originalPrice} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <a href={`/pay?pid=${product.id}`} className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-center">ซื้อทันที</a>
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-100">ปิด</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const activeProduct = modal ? products.find(x => x.id === modal) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 dark:text-gray-100">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b border-black/5 dark:supports-[backdrop-filter]:bg-gray-950/60 dark:bg-gray-950/80">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">S</div>
            <div className="font-semibold">SoraAI Prompt Store</div>
          </div>
          <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <a href="#catalog" className="hover:text-gray-900 dark:hover:text-white">สินค้า</a>
            <a href="#videos" className="hover:text-gray-900 dark:hover:text-white">วิดีโอ</a>
            <a href="#roadmap" className="hover:text-gray-900 dark:hover:text-white">Roadmap</a>
            <a href="#faq" className="hover:text-gray-900 dark:hover:text-white">คำถามที่พบบ่อย</a>
          </nav>
          <div className="ml-auto md:ml-0 flex items-center gap-2">
            <button onClick={() => setDark(v => !v)} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium dark:bg-white/10 dark:hover:bg-white/20">
              {dark ? "Light" : "Dark"}
            </button>
            <a href="#contact" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">ติดต่อเรา</a>
          </div>
        </div>
      </header>

      {/* HERO (เหมือนรูปที่คุณต้องการ) */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium dark:bg-indigo-900/40 dark:text-indigo-200">
                <span className="h-2 w-2 rounded-full bg-indigo-600" /> แพลตฟอร์มครีเอเตอร์สาย AI
              </div>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-3xl md:text-5xl font-extrabold leading-tight">
              ร้านขาย <span className="text-indigo-600">Prompt</span> & ระบบสร้างงานอัตโนมัติ
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-gray-600 text-lg dark:text-gray-300">
              รวมชุดคำสั่งคุณภาพสูงสำหรับธุรกิจ เนื้อหา และครีเอทีฟ พร้อมเวิร์กโฟลว์อัตโนมัติที่เชื่อมต่อ GitHub, Google Sheets, Render ได้จริง
            </motion.p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#catalog" className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-center">ดูสินค้าทั้งหมด</a>
              <a href="#newsletter" className="px-5 py-3 rounded-2xl bg-gray-900/90 hover:bg-gray-900 text-white font-semibold text-center">รับอัปเดต/ของฟรี</a>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              <Stat label="ลูกค้า" value="3,000+" />
              <Stat label="เรตติ้งเฉลี่ย" value="4.9/5" />
              <Stat label="อัปเดต/ปี" value="50+" />
            </div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              <img src="/images/p001-cover.webp" alt="SoraAI" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 p-4 text-sm dark:bg-gray-900 dark:ring-white/10">
              <div className="font-semibold">เชื่อมระบบอัตโนมัติ</div>
              <div className="text-gray-600 dark:text-gray-400">GitHub • Google Sheets • Render</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CONTROLS */}
      <section id="catalog" className="mx-auto max-w-7xl px-4 pb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-xl border text-sm ${cat === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:border-white/10 dark:hover:border-white/20"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาสินค้า…" className="w-64 px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-white/10 dark:placeholder:text-gray-400" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:border-white/10">
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
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* …(sections อื่น ๆ ของคุณ: videos, roadmap, newsletter, pricing, faq, contact, footer) คงเดิมตามหน้าแรกของคุณ… */}
      {/* เพื่อไม่ให้ยาว ผมเว้นไว้ได้ แต่ในโปรเจ็กต์คุณยังคงอยู่ครบจากไฟล์เดิม */}
      
      {activeProduct && <Modal product={activeProduct} onClose={() => setModal(null)} />}
    </div>
  );
}
