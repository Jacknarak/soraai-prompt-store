// /pages/success.js
import Head from 'next/head';
import Link from 'next/link';
import { getProductById, getCatalog, resolveDownloadTarget, typeLabel } from '../lib/catalog';

export default function SuccessPage({ product, store }) {
  const storeName = store?.name || 'InkChain AI Store';
  if (!product) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">ไม่พบสินค้า</h1>
        <div className="mt-6"><Link href="/" className="rounded-xl border px-4 py-2 hover:bg-gray-50">← กลับหน้าแรก</Link></div>
      </section>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Order',
    seller: { '@type': 'Organization', name: storeName },
    acceptedOffer: { '@type': 'Offer', itemOffered: { '@type': 'Product', name: product.title, sku: product.sku } },
    orderStatus: 'https://schema.org/OrderDelivered'
  };

  const { href, external } = resolveDownloadTarget(product);
  const isNFT = (product.type || '') === 'NFT';

  return (
    <>
      <Head>
        <title>ขอบคุณ — {product.title} | {storeName}</title>
        <meta name="robots" content="noindex" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border p-6">
          <h1 className="text-2xl md:text-3xl font-bold">ขอบคุณสำหรับการสนับสนุน 🎉</h1>
          <p className="mt-2 text-gray-600">
            {isNFT ? 'เปิดดูรายการ NFT ของคุณได้จากลิงก์ด้านล่าง' : 'ดาวน์โหลดไฟล์ของคุณได้ทันทีด้านล่าง'}
          </p>

          <div className="mt-6 flex items-start gap-4">
            <img src={product.image} alt={product.title} className="h-24 w-32 rounded-lg object-cover" />
            <div>
              <h2 className="font-semibold">{product.title}</h2>
              <p className="text-sm text-gray-600">{typeLabel(product.type || 'Prompt')} • {product.category} • {product.level}</p>

              <div className="mt-4">
                {external ? (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center justify-center rounded-xl bg-black text-white px-4 py-2 text-sm hover:bg-gray-800">
                    {isNFT ? 'เปิดดู NFT' : 'เปิดลิงก์ดาวน์โหลด'}
                  </a>
                ) : (
                  <a href={href} download
                     className="inline-flex items-center justify-center rounded-xl bg-black text-white px-4 py-2 text-sm hover:bg-gray-800">
                    ดาวน์โหลดไฟล์
                  </a>
                )}
              </div>

              {!external && (
                <p className="mt-3 text-xs text-gray-500">
                  ไฟล์ถูกเก็บใน <code>/public/products</code> (แยกตามประเภท) — หากแก้ชื่อไฟล์ อย่าลืมอัปเดตใน <code>meta.json</code>
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/" className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">← กลับหน้าแรก</Link>
            {product.gumroad ? (
              <a href={product.gumroad} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
                ซื้อเวอร์ชัน Global (Gumroad)
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps({ query }) {
  const pid = query?.pid ? String(query.pid) : '';
  try {
    const [catalog, product] = await Promise.all([getCatalog(), getProductById(pid)]);
    return { props: { store: catalog?.store || null, product: product || null } };
  } catch {
    return { props: { store: null, product: null } };
  }
}
