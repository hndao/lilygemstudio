/**
 * Privacy Policy — /privacy
 *
 * WHY STATIC: Legal pages never need ISR — they change only when counsel
 * updates them, at which point a full redeploy is appropriate anyway.
 * export const dynamic = 'force-static' ensures Vercel caches this at the
 * CDN edge indefinitely (until next deploy).
 */

import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Privacy Policy | LilyGem Studio',
  description:
    'How LilyGem Studio collects and uses your personal information — strictly for order fulfillment and purchase communication.',
  alternates: { canonical: 'https://lilygemstudio.com/privacy' },
};

const LAST_UPDATED = 'February 24, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-12 md:px-6 md:py-16 lg:px-8">
      <header className="mb-10">
        <p className="brand-label mb-2">Legal</p>
        <h1 className="mb-3">Privacy Policy</h1>
        <p className="text-sm text-(--color-muted)">Last updated: {LAST_UPDATED}</p>
      </header>

      <div>

        <Section title="1. Information We Collect">
          <p>
            When you place an order through our Etsy shop, we receive the shipping address, contact
            details, and order information you provide at checkout. This information is managed by
            Etsy in accordance with their privacy policy. On this website, we may also collect
            anonymised browsing data (e.g., page views) solely to improve your experience.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>
            We use your personal information <strong>only</strong> for the following purposes:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>To process and fulfil your order (shipping, packaging, dispatch).</li>
            <li>To communicate with you directly about your purchase (tracking, delays, issues).</li>
            <li>To comply with applicable legal and tax obligations.</li>
          </ul>
          <p>
            We do <strong>not</strong> sell, rent, or share your personal data with third parties
            for marketing purposes.
          </p>
        </Section>

        <Section title="3. Payment Information">
          <p>
            All payments are processed securely through Etsy&apos;s payment platform, which supports
            Visa, Mastercard, and other major methods. LilyGem Studio never receives, stores, or
            has access to your full credit card details.
          </p>
        </Section>

        <Section title="4. Data Retention">
          <p>
            We retain your order and contact information only as long as necessary to fulfil your
            order and meet our legal obligations. We do not store payment card data at any point.
          </p>
        </Section>

        <Section title="5. Contact Us">
          <p>
            For any questions about how your personal data is handled, please reach out via our
            Etsy shop messaging system or contact us at{' '}
            <a href="mailto:hello@lilygemstudio.com" className="text-(--color-sage) underline">
              hello@lilygemstudio.com
            </a>.
          </p>
        </Section>

      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl">{title}</h2>
      <div className="flex flex-col gap-3 text-(--color-foreground)/80 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

