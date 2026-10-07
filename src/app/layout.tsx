import type { Metadata, Viewport } from "next";
import { Golos_Text, IBM_Plex_Mono, Prata } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TabBar from "@/components/TabBar";
import JsonLd from "@/components/JsonLd";
import Metrika from "@/components/Metrika";
import { SITE } from "@/lib/site";

const display = Prata({ variable: "--font-display", subsets: ["latin", "cyrillic"], weight: "400" });
const sans = Golos_Text({ variable: "--font-sans", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Таро, астрология, нумерология и сонник`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: "website", locale: SITE.locale, siteName: SITE.name },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
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
    <html lang="ru" className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <TabBar />
        <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, inLanguage: "ru" }} />
        <Metrika />
      </body>
    </html>
  );
}
