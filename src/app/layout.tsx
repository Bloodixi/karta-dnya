import type { Metadata, Viewport } from "next";
import { Golos_Text, IBM_Plex_Mono, Prata } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TabBar from "@/components/TabBar";
import JsonLd from "@/components/JsonLd";
import Metrika from "@/components/Metrika";
import { SITE, SOCIAL } from "@/lib/site";

const display = Prata({ variable: "--font-prata", subsets: ["latin", "cyrillic"], weight: "400" });
// У Prata единица похожа на «l» — цифры заголовков берём из Old Standard TT (только 0–9).
const digits = localFont({ src: "../fonts/digits.woff2", variable: "--font-digits", weight: "400", declarations: [{ prop: "unicode-range", value: "U+0030-0039" }] });
const sans = Golos_Text({ variable: "--font-sans", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Таро, астрология, нумерология и сонник`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: "website", locale: SITE.locale, siteName: SITE.name },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  other: { "zen-verification": "aHCHPveu0o4Sy73w9ZPxMM8SNFqTWecWOpSsZqI30YqiyVU0ItQg6o8eVaiOMmhD" }, // подтверждение сайта для канала dzen.ru/karta_dnya_ru
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ecebee" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1b1f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${digits.variable} ${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <TabBar />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              { "@type": "WebSite", "@id": `${SITE.url}/#website`, name: SITE.name, alternateName: "karta-dnya.ru", url: SITE.url, inLanguage: "ru", publisher: { "@id": `${SITE.url}/#org` } },
              { "@type": "Organization", "@id": `${SITE.url}/#org`, name: SITE.name, url: SITE.url, logo: `${SITE.url}/logo-512.png`, sameAs: Object.values(SOCIAL).map((s) => s.url) },
            ],
          }}
        />
        <Metrika />
      </body>
    </html>
  );
}
