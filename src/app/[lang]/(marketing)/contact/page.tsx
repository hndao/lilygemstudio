/**
 * Contact — /[lang]/contact
 *
 * ISR: revalidates every 24h — matches the SETTINGS cache TTL.
 * Contact details (emails) and all text content come from admin Settings.
 * The ContactForm component handles its own field labels via the i18n dict.
 */

import type { Metadata } from 'next';
import { ContactForm } from '@/components/features/ContactForm';
import { getSiteSettings } from '@/lib/api';
import type { PageContactContent } from '@/types';
import type { Locale } from '@/middleware';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'vi' }];
}

export const metadata: Metadata = {
  title: 'Contact | LilyGem Studio',
  description:
    'Get in touch with LilyGem Studio — for product questions, custom orders, or anything else.',
  alternates: { canonical: 'https://lilygemstudio.com/contact' },
  openGraph: {
    title: 'Contact | LilyGem Studio',
    description: 'Get in touch with LilyGem Studio — for product questions, custom orders, or anything else.',
    type: 'website',
  },
};

// ── Text resolver ─────────────────────────────────────────────────────────────

function txt(c: PageContactContent | undefined, key: string, lang: string, fallback: string): string {
  if (!c) return fallback;
  const val = (c as Record<string, unknown>)[`${key}_${lang}`] ?? (c as Record<string, unknown>)[`${key}_en`];
  return typeof val === 'string' && val.trim() ? val : fallback;
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props { params: Promise<{ lang: Locale }> }

export default async function ContactPage({ params }: Props) {
  const { lang } = await params;
  const settings = await getSiteSettings().catch(() => null);
  const c = settings?.pages?.page_contact;

  // Contact details from Settings → Site Identity
  const contactDetails = [
    settings?.site?.contact_email
      ? { icon: '✉️', label: lang === 'vi' ? 'Liên hệ chung' : 'General Inquiries', value: settings.site.contact_email, href: `mailto:${settings.site.contact_email}` }
      : null,
    settings?.site?.support_email
      ? { icon: '🛠️', label: lang === 'vi' ? 'Hỗ trợ' : 'Support', value: settings.site.support_email, href: `mailto:${settings.site.support_email}` }
      : null,
  ].filter(Boolean) as { icon: string; label: string; value: string; href: string }[];

  // Response time may contain newlines — split for rendering
  const responseTimeLines = txt(
    c,
    'response_time',
    lang,
    lang === 'vi'
      ? 'Thứ 2 – Thứ 6, 9:00 – 17:00\nChúng tôi cố gắng trả lời trong vòng 24 giờ.'
      : 'Mon – Fri, 9 am – 5 pm ET\nWe aim to reply within 24 hours.',
  ).split('\n');

  return (
    <main>
      {/* ── Page header ── */}
      <section className="bg-(--color-sand-light) py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 text-center">
          <span className="brand-label">
            {txt(c, 'hero_label', lang, 'Get in Touch')}
          </span>
          <h1 className="mt-3">
            {txt(c, 'hero_title', lang, "We'd Love to Hear From You")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-(--color-muted) leading-relaxed">
            {txt(c, 'hero_body', lang, 'Whether you have a question about a product, want to partner with us as an artisan, or just want to say hello — we read every message.')}
          </p>
        </div>
      </section>

      {/* ── Form + sidebar ── */}
      <section className="bg-(--color-background) py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] lg:grid lg:grid-cols-5">

            {/* ── Sidebar ── */}
            <aside className="bg-(--color-stone) p-8 lg:col-span-2 lg:p-12">
              <span className="brand-label text-(--color-sand)/60">
                {lang === 'vi' ? 'Liên hệ' : 'Reach Us'}
              </span>
              <h2 className="mt-3 font-heading text-2xl font-700 text-(--color-cream)">
                {txt(c, 'sidebar_heading', lang, 'Contact Details')}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-(--color-sand)/70">
                {txt(c, 'sidebar_body', lang, 'We typically respond within 1–2 business days. For urgent questions, email us directly.')}
              </p>

              {contactDetails.length > 0 && (
                <ul className="mt-10 flex flex-col gap-8">
                  {contactDetails.map((detail) => (
                    <li key={detail.label} className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base">
                        {detail.icon}
                      </div>
                      <div>
                        <p className="font-heading text-xs font-600 uppercase tracking-widest text-(--color-sand)/50">
                          {detail.label}
                        </p>
                        <a
                          href={detail.href}
                          className="mt-1 block text-sm text-(--color-sand) transition-colors hover:text-white"
                        >
                          {detail.value}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-12 border-t border-white/10 pt-8">
                <p className="font-heading text-xs font-600 uppercase tracking-widest text-(--color-sand)/50">
                  {lang === 'vi' ? 'Thời gian phản hồi' : 'Response Time'}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-(--color-sand)/70">
                  {responseTimeLines.map((line, i) => (
                    <span key={i}>{line}{i < responseTimeLines.length - 1 && <br />}</span>
                  ))}
                </p>
              </div>
            </aside>

            {/* ── Form panel ── */}
            <div className="bg-white p-8 lg:col-span-3 lg:p-12">
              <h2 className="font-heading text-2xl font-700 text-(--color-stone)">
                {txt(c, 'form_heading', lang, 'Send a Message')}
              </h2>
              <p className="mt-2 text-sm text-(--color-muted)">
                {txt(c, 'form_subheading', lang, 'All fields are required.')}
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
