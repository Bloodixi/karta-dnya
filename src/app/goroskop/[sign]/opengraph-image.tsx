import { ImageResponse } from "next/og";
import { C, Chip, Frame, OG_SIZE, Sub, Title, ogFonts } from "../../_og/og";
import { findZodiac, getZodiac } from "@/lib/content";
import { PERIODS, PERIOD_KEYS, type PeriodKey } from "@/lib/daily";

export const alt = "Гороскоп";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

const ELEMENT: Record<string, string> = { "Огонь": "#c4583f", "Земля": "#3f7a52", "Воздух": "#7b5fc2", "Вода": "#2f6f9a" };

export function generateStaticParams() {
  return [...getZodiac().map((z) => ({ sign: z.slug })), ...PERIOD_KEYS.filter((p) => p !== "segodnya").map((p) => ({ sign: p }))];
}

export default async function Image({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const z = findZodiac(sign);
  const period = PERIODS[sign as PeriodKey];
  const title = z ? `${z.name}: гороскоп на сегодня` : period ? `Гороскоп ${period.title}` : "Гороскоп";
  const sub = z ? `${z.dates} · ${z.element} · ${z.planet}` : "Для всех знаков зодиака: любовь, дела, самочувствие и совет";
  return new ImageResponse(
    (
      <Frame kicker="гороскоп">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingRight: 40 }}>
          <Chip>{z ? "знак зодиака" : "все 12 знаков"}</Chip>
          <Title size={72}>{title}</Title>
          <Sub>{sub}</Sub>
        </div>
        {z && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 300, height: 300, borderRadius: 999, background: ELEMENT[z.element] || C.bg2, border: `4px solid ${C.gold}`, alignSelf: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: 150, color: C.cream, lineHeight: 1 }}>{z.name.slice(0, 1)}</div>
          </div>
        )}
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
