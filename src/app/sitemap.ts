import type { MetadataRoute } from "next";
import { getArticles, getDreams, getNumerology, getSpreads, getStones, getTarot, getZodiac } from "@/lib/content";
import { allPairs } from "@/lib/compat";
import { getClockNumbers } from "@/lib/clock";
import { PERIOD_KEYS, shiftKey, todayKey } from "@/lib/daily";
import { SECTION_KEYS, SITE } from "@/lib/site";
import { getAuthors } from "@/lib/authors";
import { getMoonSigns } from "@/lib/moonSigns";

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
    { url: u("/lunnyy-kalendar"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: u("/taro/tri-karty"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: u("/kvadrat-pifagora"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: u("/astrologiya/natalnaya-karta"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: u("/astrologiya/voshodyaschiy-znak"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: u("/astrologiya/retrogradnyy-merkuriy"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: u("/astrologiya/luna-v-znake"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: u("/astrologiya/tranzity"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: u("/astrologiya/kak-my-schitaem"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: u("/taro/arkany/starshie"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: u("/taro/arkany/mladshie"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
  out.push({ url: u("/taro/rasklady"), lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  for (const s of getSpreads()) if (!s.href) out.push({ url: u(`/taro/rasklady/${s.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  out.push({ url: u("/numerologiya/chisla-na-chasah"), lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  for (const c of getClockNumbers()) out.push({ url: u(`/numerologiya/chisla-na-chasah/${c.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const p of ["/numerologiya/po-date-rozhdeniya", "/numerologiya/sovmestimost", "/numerologiya/chislo-imeni", "/numerologiya/lichnyy-god", "/numerologiya/schastlivoe-chislo", "/numerologiya/master-chisla"]) out.push({ url: u(p), lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  for (const n of getNumerology()) out.push({ url: u(`/chislo-sudby/${n.number}`), lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  for (const s of SECTION_KEYS) out.push({ url: u(`/${s}`), lastModified: now, changeFrequency: "weekly", priority: 0.8 });
  const periods = PERIOD_KEYS.filter((p) => p !== "segodnya");
  for (const p of periods) out.push({ url: u(`/goroskop/${p}`), lastModified: now, changeFrequency: "daily", priority: 0.8 });
  for (const z of getZodiac()) {
    out.push({ url: u(`/goroskop/${z.slug}`), lastModified: now, changeFrequency: "daily", priority: 0.8 });
    for (const p of periods) out.push({ url: u(`/goroskop/${z.slug}/${p}`), lastModified: now, changeFrequency: "daily", priority: 0.7 });
  }
  out.push({ url: u("/sovmestimost"), lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  for (let i = -7; i <= 30; i++) { const k = shiftKey(todayKey(), i); out.push({ url: u(`/lunnyy-kalendar/${k}`), lastModified: now, changeFrequency: "daily", priority: 0.6 }); }
  for (const pr of allPairs()) out.push({ url: u(`/sovmestimost/${pr.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const c of getTarot()) out.push({ url: u(`/taro/karty/${c.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const d of getDreams()) out.push({ url: u(`/sonnik/${d.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const s of getStones()) out.push({ url: u(`/kamni/${s.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  out.push({ url: u("/kamni/po-znaku-zodiaka"), lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  out.push({ url: u("/kamni/po-date-rozhdeniya"), lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  for (const z of getZodiac()) out.push({ url: u(`/kamni/po-znaku-zodiaka/${z.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  for (const m of getMoonSigns()) out.push({ url: u(`/astrologiya/luna-v-znake/${m.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
  for (const a of getAuthors()) out.push({ url: u(`/avtory/${a.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.5 });
  const seen = new Set(out.map((x) => x.url));
  for (const a of getArticles()) {
    const url = u(`/${a.section}/${a.slug}`);
    if (seen.has(url)) continue; // статья, которую заменила отдельная страница (например, ретроградный Меркурий)
    out.push({ url, lastModified: new Date(a.date || now), changeFrequency: "monthly", priority: 0.7 });
  }
  return out;
}
