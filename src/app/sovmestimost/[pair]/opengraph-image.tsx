import { ImageResponse } from "next/og";
import { C, Chip, Frame, OG_SIZE, Sub, Title, ogFonts } from "../../_og/og";
import { allPairs, compatibility, parsePair } from "@/lib/compat";

export const alt = "Совместимость знаков зодиака";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  return allPairs().map((p) => ({ pair: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const p = parsePair(pair);
  const c = p ? compatibility(p.a, p.b) : null;
  return new ImageResponse(
    (
      <Frame kicker="совместимость">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingRight: 40 }}>
          <Chip>{p ? `${p.a.element} и ${p.b.element}` : "знаки зодиака"}</Chip>
          <Title size={72}>{p ? `${p.a.name} и ${p.b.name}` : "Совместимость"}</Title>
          <Sub>{c ? `${c.verdict} · любовь ${c.love}%, дружба ${c.friendship}%, работа ${c.work}%` : "Проверьте любую пару знаков"}</Sub>
        </div>
        {c && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 300, height: 300, borderRadius: 999, border: `4px solid ${C.gold}`, background: C.bg2, alignSelf: "center" }}>
            <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: 120, color: C.cream, lineHeight: 1 }}>{c.score}%</div>
            <div style={{ display: "flex", fontSize: 22, color: C.muted }}>общая совместимость</div>
          </div>
        )}
      </Frame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
