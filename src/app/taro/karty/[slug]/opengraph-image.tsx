import { ImageResponse } from "next/og";
import { C, Chip, Frame, OG_SIZE, Sub, Title, cardDataUrl, ogFonts } from "../../../_og/og";
import { findTarot, getTarot } from "@/lib/content";

export const alt = "Значение карты Таро";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  return getTarot().map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = findTarot(slug);
  const img = c ? await cardDataUrl(c.slug) : null;
  return new ImageResponse(
    (
      <Frame kicker="значения карт Таро">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingRight: 40 }}>
          <Chip>{c ? (c.arcana === "major" ? `Старший аркан ${c.number}` : c.suitName) : "Таро"}</Chip>
          <Title size={76}>{c ? c.name : "Карта Таро"}</Title>
          <Sub>{c ? c.keywords.slice(0, 4).join(" · ") : ""}</Sub>
          <div style={{ display: "flex", marginTop: 28, fontSize: 24, color: C.cream }}>Прямое и перевёрнутое положение, любовь, работа, совет</div>
        </div>
        {img && (
          <div style={{ display: "flex", width: 262, height: 452, borderRadius: 10, border: `3px solid ${C.gold}`, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} width={262} height={452} alt="" style={{ objectFit: "cover" }} />
          </div>
        )}
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
