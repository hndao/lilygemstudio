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
  title: 'Privacy Policy | DARIIV',
  description:
    'How DARIIV collects, uses, and protects your personal information in compliance with US and Canadian privacy law.',
  alternates: { canonical: 'https://dariiv.com/privacy' },
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
            We collect minimal data necessary to improve your browsing experience, including
            device information (via cookies) and any information you voluntarily provide through
            our contact forms or newsletter signups.
          </p>
        </Section>

        <Section title="2. How We Use Data">
          <p>
            We use this information to analyze site traffic, personalize content, and notify you
            of price drops (if opted-in). We do{' '}
            <strong>not</strong> sell your personal data to third parties.
          </p>
        </Section>

        <Section title="3. Third-Party Links">
          <p>
            Our site contains links to external retail websites. Once you leave DARIIV.com, their
            respective privacy policies apply. We encourage you to review the policies of any site
            you visit.
          </p>
        </Section>

        <Section title="4. Your Rights">
          <p>
            Depending on your location (such as California or Canada), you may have specific rights
            regarding your data access and deletion. Contact us at{' '}
            <a href="mailto:hello@dariiv.com" className="text-(--color-sage) underline">
              hello@dariiv.com
            </a>{' '}
            for any inquiries.
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

