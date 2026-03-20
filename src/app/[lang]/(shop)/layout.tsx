/**
 * Shop layout — wraps catalog and product detail pages.
 *
 * The [lang] parent layout handles Header + Footer rendering,
 * so this group layout only needs to wrap children in a fragment.
 */

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
