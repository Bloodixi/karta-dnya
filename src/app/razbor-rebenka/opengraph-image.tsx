import { ImageResponse } from "next/og";
import { Frame, OG_SIZE, Sub, Title, ogFonts } from "../_og/og";

export const alt = "Разбор ребёнка по дате рождения";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 1000 }}>
          <Title size={68}>Разбор ребёнка по дате рождения</Title>
          <Sub>Для родителя: характер, сильные стороны, как поддержать и к каким занятиям присмотреться.</Sub>
        </div>
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
