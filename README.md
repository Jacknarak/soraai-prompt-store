# InkChain AI Store — เพิ่มสินค้าใน 60 วิ

โครงสร้างสำคัญ
- ปกสินค้า: `public/images/<your-cover>.webp`
- ไฟล์ขาย: `public/products/<PRODUCT_ID>.zip`
- แคตตาล็อก: `public/catalog/meta.json` ← **Source of Truth เดียว**

ขั้นตอนเพิ่มสินค้า
1. วางไฟล์ปกลงใน `public/images/` และไฟล์ .zip ลงใน `public/products/`
2. เปิด `public/catalog/meta.json` แล้วเพิ่มรายการใหม่ลงใน `products[]` ตัวอย่าง:
   ```json
   {
     "id": "P-004",
     "sku": "P-004",
     "title": "Prompt Business TH Pack 4",
     "category": "Prompt Pack",
     "level": "Pro",
     "priceTHB": 590,
     "priceUSD": 14.99,
     "image": "/images/p004-cover.webp",
     "file": "/products/P-004.zip",
     "rating": 4.9,
     "sales": 0,
     "includes": ["100 Prompts","PDF + DOCX + MD","พร้อมใช้"],
     "gumroad": ""   // ถ้าขายต่างประเทศ ใส่ลิงก์ Gumroad ได้
   }
