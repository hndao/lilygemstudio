/**
 * Contact — /contact
 *
 * WHY RSC WRAPPER + CLIENT FORM:
 *  The page header, metadata, and contact info are static — rendered server-side.
 *  Only the form itself needs client interactivity (field state, submit status).
 *  This split keeps the page shell cacheable at the CDN edge.
 */

import type { Metadata } from 'next';
import { ContactForm } from '@/components/features/ContactForm';
import { getSiteSettings } from '@/lib/api';

// ISR: revalidate every 24h — matches SETTINGS TTL in cache.ts.
// Settings only change when the admin saves, so 24h is effectively static.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Contact | DARIIV',
  description:
    'Get in touch with the DARIIV team — for product questions, artisan partnerships, press inquiries, or anything else.',
  alternates: { canonical: 'https://dariiv.com/contact' },
  openGraph: {
    title: 'Contact | DARIIV',
    description:
      'Get in touch with the DARIIV team — for product questions, artisan partnerships, press inquiries, or anything else.',
    type: 'website',
  },
};

export default async function ContactPage() {
  const settings = await getSiteSettings().catch(() => null);

  // Build contact details from CMS — only include emails that are set in admin Settings.
  // contact_email → "General Inquiries", support_email → "Support"
  const contactDetails = [
    settings?.site?.contact_email
      ? { icon: '✉️', label: 'General Inquiries', value: settings.site.contact_email, href: `mailto:${settings.site.contact_email}` }
      : null,
    settings?.site?.support_email
      ? { icon: '🛠️', label: 'Support', value: settings.site.support_email, href: `mailto:${settings.site.support_email}` }
      : null,
  ].filter(Boolean) as { icon: string; label: string; value: string; href: string }[];

  return (
    <main>
      {/* ── Page header ── */}
      <section className="bg-(--color-sand-light) py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 text-center">
          <span className="brand-label">Get in Touch</span>
          <h1 className="mt-3">We&apos;d Love to Hear From You</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-(--color-muted) leading-relaxed">
            Whether you have a question about a product, want to partner with us as an artisan,
            or just want to say hello — we read every message.
          </p>
        </div>
      </section>

      {/* ── Form + sidebar ── */}
      <section className="bg-(--color-background) py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          {/* Card wrapper — two-tone split */}
          <div className="overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] lg:grid lg:grid-cols-5">

            {/* ── Sidebar — dark stone panel ── */}
            <aside className="bg-(--color-stone) p-8 lg:col-span-2 lg:p-12">
              <span className="brand-label text-(--color-sand)/60">Reach Us</span>
              <h2 className="mt-3 font-heading text-2xl font-700 text-(--color-cream)">
                Contact Details
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-(--color-sand)/70">
                We typically respond within 1–2 business days.
                For urgent questions, email us directly.
              </p>

              {contactDetails.length > 0 && (
                <ul className="mt-10 flex flex-col gap-8">
                  {contactDetails.map((c) => (
                    <li key={c.label} className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base">
                        {c.icon}
                      </div>
                      <div>
                        <p className="font-heading text-xs font-600 uppercase tracking-widest text-(--color-sand)/50">
                          {c.label}
                        </p>
                        <a
                          href={c.href}
                          className="mt-1 block text-sm text-(--color-sand) transition-colors hover:text-white"
                        >
                          {c.value}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-12 border-t border-white/10 pt-8">
                <p className="font-heading text-xs font-600 uppercase tracking-widest text-(--color-sand)/50">
                  Response Time
                </p>
                <p className="mt-3 text-sm leading-relaxed text-(--color-sand)/70">
                  Mon – Fri, 9 am – 5 pm ET<br />
                  We aim to reply within 24 hours.
                </p>
              </div>
            </aside>

            {/* ── Form panel ── */}
            <div className="bg-white p-8 lg:col-span-3 lg:p-12">
              <h2 className="font-heading text-2xl font-700 text-(--color-stone)">Send a Message</h2>
              <p className="mt-2 text-sm text-(--color-muted)">
                All fields are required.
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

