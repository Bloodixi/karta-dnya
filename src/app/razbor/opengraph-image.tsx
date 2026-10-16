import { ImageResponse } from "next/og";
import { Frame, OG_SIZE, Sub, Title, ogFonts } from "../_og/og";

export const alt = "Нумерологический разбор по дате рождения";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 1000 }}>
          <Title size={68}>Нумерологический разбор по дате рождения</Title>
          <Sub>Твои числа, сильные стороны, любовь и работа, прогноз на 12 месяцев и буклет A5 в PDF.</Sub>
        </div>
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
