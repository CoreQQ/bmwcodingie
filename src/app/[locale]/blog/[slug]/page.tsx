import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ArrowLeft, ArrowRight, Clock, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { MobileActionBar } from '@/components/site/MobileActionBar';
import { getSettings, waLink } from '@/lib/data';
import { BLOG_POSTS, getPost } from '@/lib/blog';
import { routing } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

export const revalidate = 86400;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    BLOG_POSTS.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: 'BMW Coding',
      title: post.metaTitle,
      description: post.description,
      images: [{ url: '/og.jpg', width: 1200, height: 630, alt: post.title }],
    },
  };
}

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPost(slug);
  if (!post) notFound();
  const settings = await getSettings();
  const wa = waLink(settings.whatsapp, 'Hi — I read your guide and I have a question about my BMW. It’s a ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'BMW Coding', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'BMW Coding', url: SITE_URL },
    image: `${SITE_URL}/og.jpg`,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <div className="grain relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
        }}
      />
      <Header />
      <main>
        <article className="relative">
          <section className="relative overflow-hidden border-b border-white/5 pb-12 pt-28 md:pb-16 md:pt-40">
            <div className="absolute inset-0 -z-10">
              <div className="blueprint absolute inset-0 opacity-60" />
              <div className="absolute inset-0 hero-glow" />
            </div>
            <div className="mx-auto max-w-3xl px-5 md:px-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-faint transition-colors hover:text-ink"
              >
                <ArrowLeft size={13} /> All guides
              </Link>
              <h1 className="text-balance mt-5 font-display text-[clamp(2rem,6vw,3.6rem)] leading-[1.02]">
                {post.title}
              </h1>
              <div className="mt-4 flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-faint">
                <span>{fmtDate(post.date)}</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {post.readMinutes} min read
                </span>
              </div>
            </div>
          </section>

          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-3xl px-5 md:px-8">
              {post.intro.map((p, i) => (
                <p key={i} className="mb-5 text-lg leading-relaxed text-muted">{p}</p>
              ))}

              {post.sections.map((s) => (
                <div key={s.heading} className="mt-10">
                  <h2 className="font-display text-2xl leading-tight text-ink md:text-3xl">{s.heading}</h2>
                  {s.paragraphs.map((p, i) => (
                    <p key={i} className="mt-4 leading-relaxed text-muted">{p}</p>
                  ))}
                  {s.bullets && (
                    <ul className="mt-4 space-y-2.5">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-muted">
                          <span className="m-stripe mt-2 h-[2px] w-5 shrink-0" /> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* CTA */}
              <div className="mt-14 border border-white/10 bg-graphite-800">
                <div className="m-stripe h-1 w-full" />
                <div className="flex flex-col items-start justify-between gap-5 p-7 md:flex-row md:items-center">
                  <div>
                    <h2 className="font-display text-2xl text-ink">Want this on your BMW?</h2>
                    <p className="mt-1 text-sm text-muted">Send the model, year and what you want — we’ll confirm what’s possible.</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-3">
                    <Link href="/#contact" className="btn-primary">Book BMW Coding</Link>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Related services */}
              <div className="mt-10">
                <h3 className="label mb-4">Related</h3>
                <div className="flex flex-wrap gap-3">
                  {post.related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/${r.slug}`}
                      className="inline-flex items-center gap-2 border border-white/10 px-4 py-2.5 text-sm text-muted transition-colors hover:border-bmw hover:text-ink"
                    >
                      {r.label} <ArrowRight size={14} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>
      <Footer settings={settings} />
      <MobileActionBar phone={settings.phone} whatsapp={settings.whatsapp} />
    </div>
  );
}
