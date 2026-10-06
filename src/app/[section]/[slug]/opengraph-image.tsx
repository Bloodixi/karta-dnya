import { ImageResponse } from "next/og";
import { C, Chip, Frame, OG_SIZE, Sub, Title, ogFonts, publicJpgDataUrl } from "../../_og/og";
import { findDream, findDreamImage, findStone, findStoneImage, getArticle, getArticles, getDreams, getStones } from "@/lib/content";
import { SECTIONS, type SectionKey } from "@/lib/site";

export const alt = "Карта дня";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  const out: { section: string; slug: string }[] = [];
  for (const a of getArticles()) out.push({ section: a.section, slug: a.slug });
  for (const d of getDreams()) out.push({ section: "sonnik", slug: d.slug });
  for (const s of getStones()) out.push({ section: "kamni", slug: s.slug });
  return out;
}

function Photo({ src }: { src: string }) {
  return (
    <div style={{ display: "flex", width: 440, height: 330, borderRadius: 18, border: `3px solid ${C.gold}`, overflow: "hidden", alignSelf: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={440} height={330} alt="" style={{ objectFit: "cover" }} />
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params;
  const key = section as SectionKey;
  let chip = "", title = SECTIONS[key]?.title || "Карта дня", sub = "", img: string | null = null;
  const kicker = SECTIONS[key]?.title.toLowerCase() || "karta-dnya.ru";
  if (key === "sonnik" && findDream(slug)) {
    const d = findDream(slug)!;
    chip = "сонник"; title = `К чему снится ${d.word.toLowerCase()}`; sub = d.short;
    img = findDreamImage(slug) ? await publicJpgDataUrl(`/dreams/${slug}-og.jpg`) : null;
  } else if (key === "kamni" && findStone(slug)) {
    const s = findStone(slug)!;
    chip = "камни и талисманы"; title = s.name; sub = `${s.color} · ${s.properties.slice(0, 3).join(", ")}`;
    img = findStoneImage(slug) ? await publicJpgDataUrl(`/stones/${slug}-og.jpg`) : null;
  } else {
    const a = await getArticle(key, slug);
    if (a) { chip = `${a.readingMinutes} мин чтения`; title = a.title; sub = a.description; }
  }
  return new ImageResponse(
    (
      <Frame kicker={kicker}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingRight: img ? 40 : 0, maxWidth: img ? 600 : 1000 }}>
          {chip && <Chip>{chip}</Chip>}
          <Title size={title.length > 40 ? 56 : 68}>{title}</Title>
          {sub && <Sub>{sub.length > 140 ? sub.slice(0, 137) + "…" : sub}</Sub>}
        </div>
        {img && <Photo src={img} />}
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
