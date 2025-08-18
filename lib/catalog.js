// lib/catalog.js
// 👉 แหล่งข้อมูลเดียวของร้าน — แก้/เพิ่มสินค้าในไฟล์นี้ไฟล์เดียว
export const products = [
  {
    id: "P-001",
    title: "Prompt Business TH Pack 1",
    tagline: "คำอธิบายสั้น",
    category: "Prompt Pack",
    level: "Pro",
    price: 89,
    originalPrice: 199,
    rating: 4.9,
    sales: 123,
    image: "/images/p001-cover.webp",     // ต้องมีไฟล์นี้ใน public/images/
    includes: ["100 Prompts","PDF + DOCX + MD"],
    files: [".pdf",".docx",".md"],
    download: "/products/P-001.zip",       // ต้องมีไฟล์นี้ใน public/products/
    stripe: "", line: "", promptpayQR: "/qr-promptpay.png",
  },
  {
    id: "P-002",
    title: "Prompt Business TH Pack 2",
    tagline: "คำอธิบาย…",
    category: "Prompt Pack",
    level: "Pro",
    price: 89,
    originalPrice: 199,
    rating: 4.8,
    sales: 200,
    image: "/images/p002-cover.webp",
    includes: ["100 Prompts","PDF + DOCX + MD"],
    files: [".pdf",".docx",".md"],
    download: "/products/P-002.zip",
    stripe: "", line: "", promptpayQR: "/qr-promptpay.png",
  },
  {
    id: "P-003",
    title: "Prompt Business TH Pack 3",
    tagline: "คำอธิบาย…",
    category: "Prompt Pack",
    level: "Pro",
    price: 89,
    originalPrice: 199,
    rating: 4.7,
    sales: 99,
    image: "/images/p003-cover.webp",
    includes: ["100 Prompts","PDF + DOCX + MD"],
    files: [".pdf",".docx",".md"],
    download: "/products/P-003.zip",
    stripe: "", line: "", promptpayQR: "/qr-promptpay.png",
  },
];

export const byId = Object.fromEntries(products.map(p => [p.id, p]));
