import { notFound } from "next/navigation";
import { SITEMAP_SECTIONS, sitemapSection, sitemapXml, type SitemapSection } from "@/lib/sitemap";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return SITEMAP_SECTIONS.map((s) => ({ name: `${s}.xml` }));
}

export async function GET(_req: Request, { params }: RouteContext<"/sitemaps/[name]">) {
  const { name } = await params;
  const section = name.replace(/\.xml$/, "") as SitemapSection;
  if (!SITEMAP_SECTIONS.includes(section)) notFound();
  return new Response(sitemapXml(sitemapSection(section)), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
