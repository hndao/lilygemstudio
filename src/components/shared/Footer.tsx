import Link from 'next/link';
import type { Locale } from '@/middleware';
import type { Dictionary } from '@/lib/i18n';

interface FooterProps {
  dict: Dictionary;
  lang: Locale;
}

export function Footer({ dict, lang }: FooterProps) {
  const year = new Date().getFullYear();
  const base = `/${lang}`;

  const FOOTER_LINKS = {
    [dict.footer.shop_heading]: [
      { href: `${base}/shop`, label: dict.footer.all_products },
      { href: `${base}/shop?badge=bestseller`, label: dict.footer.bestsellers },
      { href: `${base}/shop?badge=new`, label: dict.footer.new_arrivals },
      { href: `${base}/shop?badge=sale`, label: dict.footer.on_sale },
    ],
    [dict.footer.company_heading]: [
      { href: `${base}/about`, label: dict.nav.about },
      { href: `${base}/contact`, label: dict.nav.contact },
    ],
    [dict.footer.legal_heading]: [
      { href: `${base}/privacy`, label: dict.nav.privacy },
      { href: `${base}/terms`, label: dict.nav.terms },
    ],
  };

  return (
    <footer className="border-t border-(--color-border) bg-(--color-sand-light) text-(--color-stone-light)">
      {/* Main footer grid */}
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href={base}
              className="font-heading text-xl font-bold text-(--color-stone) transition-opacity hover:opacity-80"
            >
              🌸 LilyGem Studio
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
              {dict.footer.tagline}
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h6 className="mb-3 text-(--color-stone-muted) uppercase text-xs tracking-widest">{group}</h6>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-(--color-muted) transition-colors hover:text-(--color-cta)"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-(--color-border)">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <p className="text-xs text-(--color-muted)">
            © {year} {dict.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
