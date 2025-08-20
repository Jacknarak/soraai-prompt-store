/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { byId } from "../lib/catalog";

export default function PayPage() {
  const router = useRouter();
  const { pid } = router.query;
  const product = pid ? byId[pid] : null;

  if (!product) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-xl font-semibold">ไม่พบสินค้า</div>
          <Link href="/" className="px-4 py-2 rounded-xl bg-indigo-600 text-white inline-block">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href="/" className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20">
            ← กลับหน้าแรก
          </Link>
          <div className="flex items-center gap-3">
            <img src={product.image} alt={product.title} className="h-16 w-28 object-cover rounded-lg" />
            <div>
              <div className="font-semibold">{product.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{product.tagline}</div>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* วิธีชำระเงิน: PromptPay */}
          <div className="p-6 rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
            <div className="font-semibold mb-2">PromptPay</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">สแกนเพื่อชำระเงินตามยอด</p>
            <div className="pt-4">
              <img
                src={product.promptpayQR || "/qr-promptpay.png"}
                alt="PromptPay QR"
                className="w-full max-w-xs rounded-xl ring-1 ring-gray-200 mx-auto"
              />
            </div>
          </div>

          {/* สรุปรายการ/ปุ่มทดสอบ */}
          <div className="p-6 rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
            <div className="font-semibold mb-2">ชำระเงิน</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">
                {product.price.toLocaleString("th-TH", { style: "currency", currency: "THB" })}
              </div>
              <div className="text-sm line-through text-gray-400">
                {product.originalPrice.toLocaleString("th-TH", { style: "currency", currency: "THB" })}
              </div>
            </div>
            <ul className="mt-4 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-1">
              {product.includes.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>

            <div className="mt-6 space-y-3">
              <Link
                href={`/success?pid=${product.id}`}
                className="w-full block text-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                ชำระเงินสำเร็จ (ทดสอบ)
              </Link>
              <Link
                href="/"
                className="w-full block text-center px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
              >
                กลับไปเลือกสินค้าอื่น
              </Link>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          * หน้านี้เป็นเดโม — เปิดใช้ Stripe/LINE OA ได้ภายหลัง
        </p>
      </div>
    </div>
  );
}
