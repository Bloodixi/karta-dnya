import { ImageResponse } from "next/og";
import { C, Chip, Frame, OG_SIZE, Sub, Title, cardDataUrl, ogFonts } from "../_og/og";
import { cardOfDay, formatDateRu, todayKey } from "@/lib/daily";

export const revalidate = 1800;
export const alt = "Карта дня Таро на сегодня";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const date = todayKey();
  const today = cardOfDay(date);
  const img = today ? await cardDataUrl(today.card.slug) : null;
  return new ImageResponse(
    (
      <Frame kicker={formatDateRu(date)}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingRight: 40 }}>
          <Chip>{today?.reversed ? "перевёрнутое положение" : "прямое положение"}</Chip>
          <Title size={76}>{today ? today.card.name : "Карта дня"}</Title>
          <Sub>{today ? today.card.keywords.slice(0, 4).join(" · ") : "Одна карта Таро на сегодня"}</Sub>
          <div style={{ display: "flex", marginTop: 28, fontSize: 24, color: C.cream }}>Карта дня Таро · толкование и совет на karta-dnya.ru</div>
        </div>
        {img && (
          <div style={{ display: "flex", width: 262, height: 452, borderRadius: 10, border: `3px solid ${C.gold}`, overflow: "hidden", ...(today?.reversed ? { transform: "rotate(180deg)" } : {}), boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} width={262} height={452} alt="" style={{ objectFit: "cover" }} />
          </div>
        )}
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
