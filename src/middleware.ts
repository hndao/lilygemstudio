import { NextRequest, NextResponse } from 'next/server';

export const SUPPORTED_LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Detect preferred locale from Accept-Language header.
 * Falls back to DEFAULT_LOCALE if no match found.
 */
function getLocaleFromRequest(req: NextRequest): Locale {
  const acceptLang = req.headers.get('accept-language');
  if (!acceptLang) return DEFAULT_LOCALE;

  const preferred = acceptLang
    .split(',')
    .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase());

  for (const lang of preferred) {
    if (SUPPORTED_LOCALES.includes(lang as Locale)) {
      return lang as Locale;
    }
  }
  return DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files, API routes, Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/go') ||
    pathname.includes('.') // static files (favicon, images, etc.)
  ) {
    return NextResponse.next();
  }

  // Detect Country from geo headers.
  // WHY cf-ipcountry first: Cloudflare proxies all traffic to Vercel, so
  // Vercel sees a Cloudflare edge IP (US) instead of the real user IP.
  // x-vercel-ip-country would always return 'US', breaking VN geo detection.
  // Cloudflare sets cf-ipcountry based on the actual client IP, so we use
  // that when available, falling back to x-vercel-ip-country for non-CF traffic.
  // For local testing without Vercel Edge, allow a ?geo=VN query parameter
  // and persist it across navigations.
  const ipCountry = req.headers.get('cf-ipcountry') ?? req.headers.get('x-vercel-ip-country');
  const isDev = process.env.NODE_ENV === 'development';
  const currentCountryCookie = req.cookies.get('NEXT_COUNTRY')?.value;
  const geoQuery = isDev ? req.nextUrl.searchParams.get('geo') : null;
  
  let countryCode = ipCountry === 'VN' ? 'VN' : 'GLOBAL';
  if (isDev) {
    // In dev, respect ?geo override, otherwise stick to current cookie to survive next/link prefetches
    if (geoQuery === 'VN' || geoQuery === 'GLOBAL') {
      countryCode = geoQuery;
    } else {
      countryCode = currentCountryCookie === 'VN' ? 'VN' : 'GLOBAL';
    }
  }
  
  let response: NextResponse | undefined;

  // Check if the pathname already starts with a supported locale
  const hasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (hasLocale) {
    response = NextResponse.next();
  } else {
    // Redirect to locale-prefixed URL
    const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value as Locale | undefined;
    const locale =
      cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)
        ? cookieLocale
        : getLocaleFromRequest(req);

    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    response = NextResponse.redirect(url);
  }

  // Always enforce the correct NEXT_COUNTRY cookie
  if (currentCountryCookie !== countryCode) {
    response.cookies.set('NEXT_COUNTRY', countryCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  // Match all request paths except API, _next/static, _next/image, favicon.ico
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png).*)'],
};
