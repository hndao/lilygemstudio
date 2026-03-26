/**
 * Root Layout — LilyGemStudio
 *
 * Minimal shell: font loading + global CSS only.
 * The [lang] nested layout handles lang attribute and page-level metadata.
 */
import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from '@next/third-parties/google';
import { CookieBanner } from '@/components/features/CookieBanner';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { CartDrawer } from '@/components/features/CartDrawer';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://lilygemstudio.com"
  ),
  title: {
    default: "LilyGem Studio — Handcrafted Gemstone Jewelry",
    template: "%s | LilyGem Studio",
  },
  description:
    "Discover handcrafted bracelets and rings made from agate, quartz, and natural gemstones. Unique pieces, ethically sourced.",
  keywords: ["gemstone jewelry", "agate bracelet", "quartz ring", "handcrafted", "thạch anh", "mã não", "vòng tay đá"],
  openGraph: {
    siteName: "LilyGem Studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@lilygemstudio",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#2D1B4E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${inter.variable} ${montserrat.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"} />
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.tagged-events.js"
          />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var country = document.cookie.match(/(^| )NEXT_COUNTRY=([^;]+)/);
                  var isVn = country && country[2] === 'VN';
                  document.documentElement.classList.add(isVn ? 'country-vn' : 'country-global');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-(--color-background) text-(--color-foreground)">
        <AuthProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
