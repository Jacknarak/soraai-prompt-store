/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { byId } from "../lib/catalog";

export default function SuccessPage() {
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
      <div className="max-w-2xl mx-auto">
        <div className="p-6 rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
          <div className="flex items-center gap-3 mb-4">
            <img src={product.image} alt={product.title} className="h-16 w-28 object-cover rounded-lg" />
            <div>
              <div className="text-xl font-semibold">ขอบคุณสำหรับการสั่งซื้อ 🎉</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{product.title}</div>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300">
            คุณสามารถดาวน์โหลดไฟล์ได้ที่ปุ่มด้านล่าง หากมีปัญหาในการดาวน์โหลดหรือต้องการใบเสร็จ กรุณาติดต่อเรา
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={product.download}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              download
            >
              ดาวน์โหลดไฟล์
            </a>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
            >
              กลับหน้าแรก
            </Link>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            * หากลิงก์ดาวน์โหลดหมดอายุ/มีปัญหา ติดต่อ LINE OA เพื่อรับลิงก์ใหม่
          </div>
        </div>
      </div>
    </div>
  );
}
