import { ImageResponse } from "next/og";
import { Frame, OG_SIZE, Sub, Title, ogFonts } from "./_og/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 1000 }}>
          <Title size={72}>{SITE.tagline}</Title>
          <Sub>Карта дня, гороскоп на сегодня и завтра, лунный календарь, значения 78 карт Таро, число судьбы, сонник и камни.</Sub>
        </div>
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
