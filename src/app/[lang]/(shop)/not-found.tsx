/**
 * Shop 404 — (shop)/not-found.tsx
 *
 * Rendered when notFound() is thrown inside any (shop) route
 * (e.g. /shop/[slug], /products/[slug]).
 *
 * WHY NO Header/Footer: (shop)/layout.tsx already wraps this with
 * Header and Footer. Adding them here would produce duplicates.
 */

import { NotFoundContent } from '@/components/shared/NotFoundContent';

export default function NotFound() {
  return <NotFoundContent />;
}
