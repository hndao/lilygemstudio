/**
 * Marketing layout — wraps homepage and editorial pages.
 *
 * The [lang] parent layout handles Header + Footer rendering,
 * so this group layout only needs to wrap children in a fragment.
 */

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
