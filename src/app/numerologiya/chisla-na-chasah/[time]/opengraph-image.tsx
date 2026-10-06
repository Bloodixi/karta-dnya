import { ImageResponse } from "next/og";
import { C, Chip, Frame, OG_SIZE, Sub, Title, ogFonts } from "../../../_og/og";
import { findClock, getClockNumbers } from "@/lib/clock";

export const alt = "Число на часах";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  return getClockNumbers().map((c) => ({ time: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ time: string }> }) {
  const { time } = await params;
  const c = findClock(time);
  return new ImageResponse(
    (
      <Frame kicker="числа на часах">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingRight: 40 }}>
          <Chip>{c ? (c.kind === "double" ? "одинаковые цифры" : "зеркальные цифры") : "нумерология"}</Chip>
          <Title size={72}>{c ? `${c.time} на часах` : "Числа на часах"}</Title>
          <Sub>{c ? `${c.title} · ${c.keywords.slice(0, 3).join(", ")}` : "Значение одинаковых и зеркальных чисел"}</Sub>
        </div>
        {c && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 340, height: 340, border: `3px solid ${C.gold}`, borderRadius: 10, alignSelf: "center", background: C.bg2 }}>
            <div style={{ display: "flex", fontFamily: "Prata", fontSize: 120, color: C.cream, lineHeight: 1 }}>{c.time}</div>
          </div>
        )}
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
