/**
 * Marketing 404 — (marketing)/not-found.tsx
 *
 * Rendered when notFound() is thrown inside any (marketing) route
 * (e.g. /journal/[slug], /artisans/[slug]).
 *
 * WHY NO Header/Footer: (marketing)/layout.tsx already wraps this with
 * Header and Footer. Adding them here would produce duplicates.
 */

import { NotFoundContent } from '@/components/shared/NotFoundContent';

export default function NotFound() {
  return <NotFoundContent />;
}
