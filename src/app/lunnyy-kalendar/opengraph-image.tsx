import { ImageResponse } from "next/og";
import { Chip, Frame, MoonSvg, OG_SIZE, Sub, Title, ogFonts } from "../_og/og";
import { formatDateRu, todayKey } from "@/lib/daily";
import { dayInfo, PHASES } from "@/lib/moon";

export const revalidate = 1800;
export const alt = "Лунный календарь на сегодня";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const key = todayKey();
  const d = dayInfo(key);
  return new ImageResponse(
    (
      <Frame kicker={formatDateRu(key)}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingRight: 40 }}>
          <Chip>лунный календарь</Chip>
          <Title size={72}>{d.lunarDay}-й лунный день</Title>
          <Sub>{PHASES[d.phase].name} · Луна в знаке {d.sign.name} · освещено {d.illumination}%</Sub>
        </div>
        <div style={{ display: "flex", alignSelf: "center" }}><MoonSvg age={d.age} size={300} /></div>
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
