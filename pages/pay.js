// /pages/pay.js
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  getProductById,
  getRates,
  resolveDownloadTarget,
  typeDisplay,
  formatTHB,
  formatUSD,
  computeUSDFromTHBWithPolicy
} from '../lib/catalog';

export default function PayPage() {
  const router = useRouter();
  const { pid } = router.query;

  const [product, setProduct] = useState(null);
  const [rates, setRates] = useState(null);
  const [currency, setCurrency] = useState('THB');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!pid) return;
      setLoading(true);
      const [p, r] = await Promise.all([getProductById(String(pid)), getRates()]);
      if (!mounted) return;
      setProduct(p || null);
      setRates(r || null);
      try {
        const saved = localStorage.getItem('inkchain:currency');
        if (saved === 'USD' || saved === 'THB') setCurrency(saved);
      } catch {}
      setLoading(false);
    }
    run();
    return () => { mounted = false; };
  }, [pid]);

  function toggleCurrency() {
    const next = currency === 'THB' ? 'USD' : 'THB';
    setCurrency(next);
    try { localStorage.setItem('inkchain:currency', next); } catch {}
  }

  const priceView = useMemo(() => {
    if (!product || !rates) return null;
    const thb = Number(product.priceTHB) || 0;
    const usd = thb > 0 ? computeUSDFromTHBWithPolicy(thb, rates, { roundingMode: 'ceilPoint99' }) : null;
    return { thb, usd };
  }, [product, rates]);

  const dl = useMemo(() => resolveDownloadTarget(product), [product]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-8 w-3/4 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">ไม่พบสินค้า</h1>
        <p className="mt-2 text-gray-600">PID: {String(pid || '')}</p>
        <Link href="/" className="mt-6 inline-block rounded-xl border px-4 py-2">กลับหน้าแรก</Link>
      </div>
    );
  }

  const rateDate = priceView?.usd?.rateUpdatedAt
    ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(priceView.usd.rateUpdatedAt))
    : '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">← กลับหน้าแรก</Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{product.title}</h1>
        <button
          onClick={toggleCurrency}
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
          title="สลับสกุลเงิน"
        >
          {currency === 'THB' ? 'THB ฿' : 'USD $'}
        </button>
      </div>

      <p className="mt-2 text-gray-600">
        {(() => {
          const parts = [];
          const t = typeDisplay(product);
          if (t) parts.push(t);
          if (product.category) parts.push(product.category);
          return parts.join(' • ');
        })()}
        {product.level ? ` • ระดับ: ${product.level}` : ''}
      </p>

      {/* ภาพตัวอย่าง */}
      <div className="mt-6 rounded-2xl overflow-hidden border">
        <img src={product.image} alt={product.title} className="w-full h-auto object-cover" />
      </div>

      {/* ราคา + สรุป FX */}
      <div className="mt-6 rounded-2xl border p-4">
        {priceView ? (
          <>
            {currency === 'USD' ? (
              <>
                <div className="text-xl font-bold">
                  {priceView.usd ? `~${formatUSD(priceView.usd.usd)}` : '—'}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {priceView.usd ? `คำนวณจาก THB ที่เรท ${priceView.usd.rate.toFixed(4)} ${rateDate ? `• rate: ${rateDate}` : ''}` : 'ไม่พบข้อมูลเรท'}
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold">
                  {formatTHB(priceView.thb)}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {priceView.usd ? `≈ ${formatUSD(priceView.usd.usd)} ${rateDate ? `• rate: ${rateDate}` : ''}` : ''}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-gray-500">กำลังคำนวณราคา…</div>
        )}
      </div>

      {/* พื้นที่ชำระเงิน */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ฝั่งซ้าย: QR PromptPay (THB) */}
        <div className="rounded-2xl border p-4">
          <h2 className="font-semibold">ชำระเงิน</h2>
          {currency === 'THB' ? (
            <>
              <p className="mt-1 text-sm text-gray-600">สแกน QR เพื่อชำระด้วย PromptPay</p>
              <div className="mt-4 rounded-xl overflow-hidden border">
                <img src="/qr-promptpay.png" alt="PromptPay QR" className="w-full h-auto" />
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-600">
                ช่องทางจ่าย USD (PingPong/Stripe) จะเปิดใช้งานเร็วๆ นี้ — ขณะนี้ขอแนะนำให้
                <button onClick={toggleCurrency} className="underline mx-1">สลับเป็น THB</button>
                เพื่อชำระด้วย PromptPay
                {product.gumroad ? (
                  <> หรือซื้อผ่าน <a className="underline" href={product.gumroad} target="_blank" rel="noopener noreferrer">Gumroad</a></>
                ) : null}
              </p>
            </>
          )}
        </div>

        {/* ฝั่งขวา: ปุ่มดาวน์โหลด / ซื้อบน Gumroad */}
        <div className="rounded-2xl border p-4">
          <h2 className="font-semibold">หลังชำระเงิน</h2>
          <p className="mt-1 text-sm text-gray-600">
            กดปุ่มด้านล่างเพื่อไปยังไฟล์ดาวน์โหลด (ตอนนี้ยังไม่ตรวจหลักฐานอัตโนมัติ)
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {dl.external ? (
              <a
                href={dl.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-black text-white px-4 py-2 text-center text-sm hover:bg-gray-800"
              >
                ดาวน์โหลดไฟล์
              </a>
            ) : (
              <Link
                href={dl.href || '#'}
                className="rounded-xl bg-black text-white px-4 py-2 text-center text-sm hover:bg-gray-800"
              >
                ดาวน์โหลดไฟล์
              </Link>
            )}

            {product.gumroad ? (
              <a
                href={product.gumroad}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border px-4 py-2 text-center text-sm hover:bg-gray-50"
              >
                Buy on Gumroad (USD)
              </a>
            ) : null}
          </div>

          <div className="mt-3 text-xs text-gray-500">
            หมายเหตุ: จะเพิ่มระบบอัปโหลดสลิป/ตรวจสอบการชำระเงินอัตโนมัติในลำดับถัดไป
          </div>
        </div>
      </div>
    </div>
  );
}
