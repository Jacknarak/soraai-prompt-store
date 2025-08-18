// pages/pay.js
import React from "react";
import { useRouter } from "next/router";
import { byId } from "../lib/catalog"; // ใช้ path แบบสัมพัทธ์

function Currency({ value }) {
  return (
    <span className="tabular-nums">
      {Number(value).toLocaleString("th-TH", { style: "currency", currency: "THB" })}
    </span>
  );
}

export default function PayPage() {
  const router = useRouter();
  const { pid } = router.query;

  // รอให้ query พร้อม (ตอน SSR/โหลดครั้งแรก pid จะยัง undefined)
  if (!pid) return null;

  const product = byId[pid];
  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 dark:text-gray-100">
        <main className="mx-auto max-w-3xl px-4 py-16 space-y-6">
          <h1 className="text-2xl font-bold">ไม่พบสินค้า</h1>
          <p className="text-gray-600 dark:text-gray-400">PID: {String(pid)}</p>
          <a href="/" className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
            กลับหน้าหลัก
          </a>
        </main>
      </div>
    );
  }

  const qrSrc = product.promptpayQR || "/qr-promptpay.png"; // มีไฟล์นี้ใน /public แล้ว

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-black/5 dark:bg-gray-950/80 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
          <a href="/" className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium dark:bg-white/10 dark:hover:bg-white/20">
            ← กลับหน้าหลัก
          </a>
          <div className="ml-auto font-semibold">ชำระเงิน</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-extrabold">ชำระเงิน: {product.title}</h1>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* กล่องข้อมูลสินค้า */}
          <div className="rounded-2xl overflow-hidden bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
            <div className="aspect-[16/9] overflow-hidden">
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 space-y-3">
              <div className="text-xl font-bold">
                ราคา: <Currency value={product.price} />{" "}
                <span className="text-sm text-gray-500 line-through">
                  <Currency value={product.originalPrice} />
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ไฟล์ที่ได้รับ: {Array.isArray(product.files) ? product.files.join(" ") : String(product.files || "")}
              </div>
              <div className="flex flex-wrap gap-2">
                {(product.includes || []).slice(0, 5).map((x) => (
                  <span key={x} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs dark:bg-white/5 dark:text-gray-300">
                    {x}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* กล่องชำระเงิน */}
          <div className="rounded-2xl overflow-hidden bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
            <div className="p-5 border-b border-gray-200 dark:border-white/10">
              <div className="text-lg font-semibold">ชำระเงินผ่าน PromptPay</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">สแกน QR ด้วย Mobile Banking ของคุณ</div>
            </div>

            <div className="p-6 grid place-items-center">
              <img
                src={qrSrc}
                alt="PromptPay QR"
                className="w-64 h-64 object-contain rounded-xl ring-1 ring-gray-200 dark:ring-white/10 bg-white"
              />
            </div>

            <div className="px-6 pb-6">
              <a
                href={`/success?pid=${product.id}`}
                className="block w-full text-center px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                ชำระเงินสำเร็จ (ทดสอบ)
              </a>
              <p className="text-xs text-gray-500 mt-3">
                * ปุ่มนี้ใช้เพื่อทดสอบการไหลของระบบเท่านั้น — เมื่อต่อกับระบบชำระเงินจริงจะเปลี่ยนเป็นตรวจสอบสถานะอัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
