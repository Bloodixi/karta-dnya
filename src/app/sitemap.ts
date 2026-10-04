import type { MetadataRoute } from "next";
import { getArticles, getDreams, getStones, getTarot, getZodiac } from "@/lib/content";
import { allPairs } from "@/lib/compat";
import { PERIOD_KEYS } from "@/lib/daily";
import { SECTION_KEYS, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const u = (p: string) => `${SITE.url}${p}`;
  const out: MetadataRoute.Sitemap = [
    { url: u("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: u("/karta-dnya"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: u("/goroskop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: u("/chislo-sudby"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: u("/taro/karty"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: u("/taro/da-net"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
  for (const s of SECTION_KEYS) out.push({ url: u(`/${s}`), lastModified: now, changeFrequency: "weekly", priority: 0.8 });
  const periods = PERIOD_KEYS.filter((p) => p !== "segodnya");
  for (const p of periods) out.push({ url: u(`/goroskop/${p}`), lastModified: now, changeFrequency: "daily", priority: 0.8 });
  for (const z of getZodiac()) {
    out.push({ url: u(`/goroskop/${z.slug}`), lastModified: now, changeFrequency: "daily", priority: 0.8 });
    for (const p of periods) out.push({ url: u(`/goroskop/${z.slug}/${p}`), lastModified: now, changeFrequency: "daily", priority: 0.7 });
  }
  out.push({ url: u("/sovmestimost"), lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  for (const pr of allPairs()) out.push({ url: u(`/sovmestimost/${pr.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const c of getTarot()) out.push({ url: u(`/taro/karty/${c.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const d of getDreams()) out.push({ url: u(`/sonnik/${d.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const s of getStones()) out.push({ url: u(`/kamni/${s.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const a of getArticles()) out.push({ url: u(`/${a.section}/${a.slug}`), lastModified: new Date(a.date || now), changeFrequency: "monthly", priority: 0.7 });
  return out;
}
