/**
 * Affiliate Disclosure — /affiliate-disclosure
 *
 * WHY A DEDICATED PAGE: The FTC requires that affiliate disclosures be
 * "clear and conspicuous." A dedicated page (linked from every footer)
 * satisfies the FTC's requirement for a comprehensive disclosure that
 * users can always find, in addition to the inline disclosures on each
 * product page.
 *
 * WHY STATIC: Legal pages change only on counsel review.
 */

import type { Metadata } from 'next';
import { AffiliateDisclosure } from '@/components/shared/AffiliateDisclosure';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | DARIIV',
  description:
    'DARIIV participates in affiliate programs. Learn how we earn commissions and how this affects our editorial independence.',
  alternates: { canonical: 'https://dariiv.com/affiliate-disclosure' },
};

export default function AffiliateDisclosurePage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-12 md:px-6 md:py-16 lg:px-8">
      <header className="mb-10">
        <p className="brand-label mb-2">Legal</p>
        <h1 className="mb-3">Affiliate Disclosure</h1>
      </header>

      {/* Prominent disclosure — same component shown below CTA on product pages */}
      <div className="mb-10">
        <AffiliateDisclosure variant="inline" />
      </div>

      <div>

        <Section title="Our Commitment to Transparency">
          <p>
            At DARIIV, we believe in transparency and honesty. To support our mission of curating
            high-quality artisan and handcrafted products, some of the links on this website are
            affiliate links.
          </p>
        </Section>

        <Section title="How Affiliate Links Work">
          <p>
            If you click on a link and make a purchase, DARIIV may earn a small commission at{' '}
            <strong>no additional cost to you</strong>. We only recommend products that meet our
            standards for quality, craftsmanship, and brand storytelling.
          </p>
        </Section>

        <Section title="Affiliate Programs">
          <p>
            DARIIV.com is a participant in several affiliate marketing programs designed to provide
            a means for sites to earn advertising fees by linking to affiliated retail sites.
          </p>
        </Section>

        <Section title="Editorial Independence">
          <p>
            Our editorial content is not influenced by these partnerships. Products are selected
            based on quality and relevance to our audience — never on commission rate.
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

