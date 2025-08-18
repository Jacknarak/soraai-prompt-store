// pages/success.js
import React from "react";
import { useRouter } from "next/router";
import { byId } from "../lib/catalog"; // ใช้ path แบบสัมพัทธ์ให้เหมือนไฟล์อื่น

function Currency({ value }) {
  return (
    <span className="tabular-nums">
      {Number(value).toLocaleString("th-TH", { style: "currency", currency: "THB" })}
    </span>
  );
}

export default function SuccessPage() {
  const router = useRouter();
  const { pid } = router.query;

  if (!pid) return null; // รอ query พร้อมตอนโหลดครั้งแรก

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

  // ไฟล์ปลายทางสำหรับดาวน์โหลด (ต้องมีอยู่จริงใน /public/products/)
  const downloadHref = product.download || "/";

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-black/5 dark:bg-gray-950/80 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
          <a href="/" className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium dark:bg-white/10 dark:hover:bg-white/20">
            ← กลับหน้าหลัก
          </a>
          <div className="ml-auto font-semibold">สั่งซื้อสำเร็จ</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl bg-white ring-1 ring-gray-200 overflow-hidden dark:bg-gray-900 dark:ring-white/10">
          <div className="grid md:grid-cols-2">
            <div className="p-6 md:p-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold dark:bg-green-900/30 dark:text-green-200">
                ✅ ชำระเงินสำเร็จ
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                ขอบคุณสำหรับการสั่งซื้อ!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                รายการของคุณ: <span className="font-semibold">{product.title}</span>
              </p>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                ยอดชำระ: <span className="font-semibold"><Currency value={product.price} /></span>{" "}
                <span className="line-through text-gray-400"><Currency value={product.originalPrice} /></span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(product.includes || []).slice(0, 6).map((x) => (
                  <span key={x} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs dark:bg-white/5 dark:text-gray-300">
                    {x}
                  </span>
                ))}
              </div>

              <div className="pt-6 space-y-3">
                <a
                  href={downloadHref}
                  download
                  className="block w-full text-center px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  ⬇️ ดาวน์โหลดไฟล์
                </a>
                <p className="text-xs text-gray-500">
                  ถ้าคลิกแล้วไม่เริ่มดาวน์โหลด ให้คลิกขวาที่ปุ่ม &gt; เลือก <b>Save link as…</b><br />
                  หรือกลับไปดูสินค้ารายการอื่น ๆ ได้ที่หน้าหลัก
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-gray-50 dark:bg-white/5">
              <div className="rounded-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-white/10">
                <div className="aspect-[16/9] bg-white">
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
                  ไฟล์ที่ได้รับ: {Array.isArray(product.files) ? product.files.join(" ") : String(product.files || "")}
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                ต้องการใบเสร็จ/ใบเสนอราคา? ติดต่อทีมงานได้ทาง LINE OA หรืออีเมล
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <a href="/" className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-100">
                  กลับหน้าหลัก
                </a>
                <a href="#line" className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold">
                  เปิด LINE OA
                </a>
                <a href="#email" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  อีเมลทีมงาน
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* หมายเหตุสำคัญ */}
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          * หน้านี้เป็นโหมดทดสอบการไหล (Sandbox). เมื่อต่อระบบชำระเงินจริงแล้ว ปุ่มจะเปลี่ยนเป็นตรวจสอบสถานะอัตโนมัติก่อนปล่อยดาวน์โหลด
        </div>
      </main>
    </div>
  );
}
