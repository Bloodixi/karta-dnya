import { sitemapIndexXml } from "@/lib/sitemap";

export const dynamic = "force-static";
export const revalidate = 3600; // lastmod ежедневных разделов — сегодня по Москве

export function GET() {
  return new Response(sitemapIndexXml(), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
