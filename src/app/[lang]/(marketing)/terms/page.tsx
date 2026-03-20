/**
 * Terms of Service — /terms
 *
 * WHY STATIC: Legal pages change only on counsel review — a full redeploy
 * is the correct invalidation mechanism, not ISR.
 */

import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Terms of Service | DARIIV',
  description:
    'The terms and conditions governing your use of DARIIV.com, an affiliate marketplace for artisan goods.',
  alternates: { canonical: 'https://dariiv.com/terms' },
};

const LAST_UPDATED = 'February 24, 2026';

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-12 md:px-6 md:py-16 lg:px-8">
      <header className="mb-10">
        <p className="brand-label mb-2">Legal</p>
        <h1 className="mb-3">Terms of Service</h1>
        <p className="text-sm text-(--color-muted)">Last updated: {LAST_UPDATED}</p>
      </header>

      <div>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing DARIIV.com, you agree to these terms and our{' '}
            <a href="/privacy" className="text-(--color-sage) underline">Privacy Policy</a>.
          </p>
        </Section>

        <Section title="2. Product Information">
          <p>
            DARIIV curates products but does not manufacture or ship them. While we strive for
            accuracy in pricing and descriptions via our automated tracking, final prices and
            availability are determined by the third-party seller at the time of purchase.
          </p>
        </Section>

        <Section title="3. Limitation of Liability">
          <p>
            DARIIV is not responsible for any issues arising from transactions made on third-party
            websites, including shipping delays, product defects, or returns.
          </p>
        </Section>

        <Section title="4. Intellectual Property">
          <p>
            All content, including the DARIIV brand story and curated artisan descriptions, is the
            property of DARIIV and may not be used without permission.
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

