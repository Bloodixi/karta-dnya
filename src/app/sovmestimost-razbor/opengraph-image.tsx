import { ImageResponse } from "next/og";
import { Frame, OG_SIZE, Sub, Title, ogFonts } from "../_og/og";

export const alt = "Совместимость пары по датам рождения";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 1000 }}>
          <Title size={68}>Совместимость пары по датам рождения</Title>
          <Sub>Образ пары, любовь и быт, где вы спорите и как договариваться, ваш общий год.</Sub>
        </div>
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
