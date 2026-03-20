/**
 * Root 404 — app/not-found.tsx
 *
 * WHY HEADER/FOOTER HERE: This file is rendered by the root layout only,
 * which has no Header/Footer of its own. It covers direct URL misses that
 * fall outside every route group (e.g. /totally-unknown-path).
 *
 * WHY NOT HERE for route-group 404s: When notFound() is thrown inside
 * (marketing) or (shop), Next.js renders the nearest not-found.tsx but still
 * applies all ancestor layouts — including the route group layout that already
 * renders Header/Footer. Those route groups define their own not-found.tsx
 * (without Header/Footer) to avoid the duplicate.
 */

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { NotFoundContent } from '@/components/shared/NotFoundContent';

export default function NotFound() {
  return (
    <>
      <Header />
      <NotFoundContent />
      <Footer />
    </>
  );
}
