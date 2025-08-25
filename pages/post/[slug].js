// /pages/post/[slug].js
import Head from 'next/head';
import Link from 'next/link';
import { getCatalog } from '../../lib/catalog';

export default function PostPage({ post, store }) {
  const storeName = store?.name || 'InkChain AI Store';

  if (!post) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">ไม่พบบทความ</h1>
        <div className="mt-4">
          <Link href="/" className="rounded-xl border px-4 py-2 hover:bg-gray-50">← กลับหน้าแรก</Link>
        </div>
      </section>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: storeName }
  };

  return (
    <>
      <Head>
        <title>{post.title} | {storeName}</title>
        <meta name="description" content={post.excerpt || ''} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/" className="text-sm text-gray-500 hover:underline">← กลับหน้าแรก</Link>
        <h1 className="mt-3 text-3xl font-bold">{post.title}</h1>
        <div className="mt-1 text-sm text-gray-500">{post.source || 'Update'} • {formatDate(post.publishedAt)}</div>

        {post.image && (
          <div className="mt-6 rounded-2xl overflow-hidden border">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {post.contentHtml ? (
          <article className="prose prose-sm md:prose base mt-6 max-w-none"
                   dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        ) : post.externalUrl ? (
          <div className="mt-6">
            <a href={post.externalUrl} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm">
              อ่านฉบับเต็มภายนอก
            </a>
          </div>
        ) : (
          <p className="mt-6 text-gray-600">บทความนี้ยังไม่มีเนื้อหา</p>
        )}
      </section>
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const catalog = await getCatalog();
    const slug = params?.slug ? String(params.slug) : '';
    const post = (catalog?.posts || []).find(p => p.slug === slug) || null;
    return { props: { post, store: catalog?.store || null } };
  } catch {
    return { props: { post: null, store: null } };
  }
}

function formatDate(s) {
  if (!s) return '';
  try { return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(s)); }
  catch { return s; }
}
