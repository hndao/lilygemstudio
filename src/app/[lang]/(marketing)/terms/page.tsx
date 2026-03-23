/**
 * Terms of Service — /terms
 *
 * WHY STATIC: Legal pages change only on counsel review — a full redeploy
 * is the correct invalidation mechanism, not ISR.
 */

import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Shop Policies | LilyGem Studio',
  description:
    'LilyGem Studio shop policies — cancellations, customs & import taxes, payments, and shipping information.',
  alternates: { canonical: 'https://lilygemstudio.com/terms' },
};

const LAST_UPDATED = 'February 24, 2026';

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-12 md:px-6 md:py-16 lg:px-8">
      <header className="mb-10">
        <p className="brand-label mb-2">Legal</p>
        <h1 className="mb-3">Shop Policies</h1>
        <p className="text-sm text-(--color-muted)">Last updated: {LAST_UPDATED}</p>
      </header>

      <div>

        <Section title="1. Cancellations">
          <p>
            We accept order cancellations requested within <strong>24 hours of purchase</strong>.
            After this window, the order will have entered production and cancellation may not be
            possible. Please contact us via Etsy Messages as soon as possible if you need to cancel.
          </p>
        </Section>

        <Section title="2. Customs & Import Taxes">
          <p>
            LilyGem Studio ships internationally from Ho Chi Minh City, Vietnam. Buyers are
            responsible for any customs duties, import taxes, or fees that may be charged by their
            country upon delivery.
          </p>
          <p>
            LilyGem Studio is not responsible for delays caused by customs clearance. These delays
            are outside our control and do not qualify for refunds or replacements.
          </p>
        </Section>

        <Section title="3. Payments">
          <p>
            All transactions are processed securely through Etsy&apos;s payment platform. We accept
            Visa, Mastercard, and other major payment methods supported by Etsy Payments.
          </p>
          <p>
            LilyGem Studio never receives, views, or stores your full credit card information.
            Payment data is handled exclusively by Etsy&apos;s secure payment infrastructure.
          </p>
        </Section>

        <Section title="4. Shipping">
          <p>
            Orders are dispatched from Ho Chi Minh City, Vietnam. Estimated delivery times vary by
            destination and are provided at checkout. While we make every effort to ship promptly,
            we cannot guarantee delivery dates once a parcel is in the care of the postal carrier
            or customs authority.
          </p>
        </Section>

        <Section title="5. Returns & Exchanges">
          <p>
            Because each piece is handcrafted from natural agate and unique in its pattern, we
            handle returns and exchanges on a case-by-case basis. If your item arrives damaged or
            is significantly different from its listing, please contact us within 7 days of receipt
            with photos and we will work to resolve the issue promptly.
          </p>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            All content on this website — including product photography, descriptions, and the
            LilyGem Studio brand identity — is the property of LilyGem Studio and may not be
            reproduced or used without written permission.
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

