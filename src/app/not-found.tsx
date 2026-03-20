/**
 * Root 404 — app/not-found.tsx
 *
 * This covers direct URL misses that fall outside the [lang] route group.
 * Header/Footer are not available here since they need dictionary props.
 * A minimal redirect-to-home message is shown instead.
 */

import Link from 'next/link';
import { NotFoundContent } from '@/components/shared/NotFoundContent';

export default function NotFound() {
  return (
    <>
      <NotFoundContent />
    </>
  );
}
