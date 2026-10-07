import type { NatalChart } from "@/lib/astro/natal";
import { aspectNature } from "@/lib/astro/natal";
import type { Body } from "@/lib/astro/types";

export const PLANET_GLYPH: Record<Body, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
};
export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map((g) => g + "\uFE0E"); // текстовый вариант, не эмодзи
const GLYPH_FONT = "'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols','Noto Sans Symbols 2',serif";

const C = 200;
const R_OUT = 192;
const R_SIGN_IN = 162;
const R_HOUSE_IN = 142;
const R_PLANET = 122;
const R_ASPECT = 92;

/** Точка на окружности: долгота L при Асценденте слева, зодиак против часовой стрелки. */
function pt(lon: number, asc: number, r: number): [number, number] {
  const theta = ((180 + lon - asc) * Math.PI) / 180;
  return [C + r * Math.cos(theta), C - r * Math.sin(theta)];
}

function norm(d: number): number {
  const x = d % 360;
  return x < 0 ? x + 360 : x;
}

function sectorPath(from: number, to: number, asc: number, r1: number, r2: number): string {
  const [x1, y1] = pt(from, asc, r2);
  const [x2, y2] = pt(to, asc, r2);
  const [x3, y3] = pt(to, asc, r1);
  const [x4, y4] = pt(from, asc, r1);
  // против часовой стрелки на экране → sweep-flag 0 для внешней дуги, 1 для внутренней
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r2},${r2} 0 0 0 ${x2.toFixed(2)},${y2.toFixed(2)} L${x3.toFixed(2)},${y3.toFixed(2)} A${r1},${r1} 0 0 1 ${x4.toFixed(2)},${y4.toFixed(2)} Z`;
}

/** Разводит глифы планет, стоящие ближе 8°, чтобы не накладывались (только для отображения). */
function spread(lons: number[], minGap = 8): number[] {
  const order = lons.map((lon, i) => ({ lon, i })).sort((a, b) => a.lon - b.lon);
  const out = lons.slice();
  let prev = -Infinity;
  for (const { lon, i } of order) {
    const shown = Math.max(lon, prev + minGap);
    out[i] = shown;
    prev = shown;
  }
  // если последний «переехал» через 360° к первому — слегка сдвигаем назад
  const first = order[0];
  const last = order[order.length - 1];
  if (order.length > 1 && out[last.i] - 360 + minGap > out[first.i]) out[last.i] = out[first.i] + 360 - minGap;
  return out;
}

/** Колесо натальной карты: кольцо знаков, куспиды домов, планеты и линии аспектов. Цвета — токены темы. */
export default function NatalWheel({ chart, className = "" }: { chart: NatalChart; className?: string }) {
  const asc = chart.houses?.asc ?? 0;
  const shown = spread(chart.planets.map((p) => p.lon));
  const cusps = chart.houses?.cusps;
  const title = chart.houses ? "Колесо натальной карты с домами" : "Колесо натальной карты без домов (время рождения неизвестно)";
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* кольцо знаков */}
      {SIGN_GLYPHS.map((g, i) => {
        const from = i * 30;
        const [tx, ty] = pt(from + 15, asc, (R_OUT + R_SIGN_IN) / 2);
        return (
          <g key={g}>
            <path d={sectorPath(from, from + 30, asc, R_SIGN_IN, R_OUT)} fill={i % 2 ? "var(--surface)" : "var(--sunk)"} stroke="var(--line)" strokeWidth="0.8" />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize="15" fill="var(--accent)" fontFamily={GLYPH_FONT}>{g}</text>
          </g>
        );
      })}
      <circle cx={C} cy={C} r={R_OUT} fill="none" stroke="var(--gold)" strokeWidth="1.2" />
      <circle cx={C} cy={C} r={R_SIGN_IN} fill="none" stroke="var(--line)" strokeWidth="0.8" />

      {/* дома */}
      {cusps ? (
        <g>
          <circle cx={C} cy={C} r={R_HOUSE_IN} fill="none" stroke="var(--line)" strokeWidth="0.8" />
          {cusps.map((c, i) => {
            const axis = i % 3 === 0; // 1, 4, 7, 10
            const [x1, y1] = pt(c, asc, axis ? R_ASPECT : R_HOUSE_IN);
            const [x2, y2] = pt(c, asc, R_SIGN_IN);
            const next = cusps[(i + 1) % 12];
            const mid = c + norm(next - c) / 2;
            const [nx, ny] = pt(mid, asc, (R_HOUSE_IN + R_SIGN_IN) / 2);
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={axis ? "var(--ink)" : "var(--line)"} strokeWidth={axis ? 1.4 : 0.8} />
                <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="var(--muted)" fontFamily="ui-monospace, monospace">{i + 1}</text>
              </g>
            );
          })}
          {(() => {
            const [ax, ay] = pt(asc, asc, R_OUT + 6);
            const [mx, my] = pt(chart.houses!.mc, asc, R_OUT + 6);
            return (
              <g fontSize="8" fill="var(--ink)" fontFamily="ui-monospace, monospace" letterSpacing="0.5">
                <text x={ax} y={ay} textAnchor="end" dominantBaseline="central">ASC</text>
                <text x={mx} y={my} textAnchor="middle" dominantBaseline="auto">MC</text>
              </g>
            );
          })()}
        </g>
      ) : (
        <circle cx={C} cy={C} r={R_HOUSE_IN} fill="none" stroke="var(--line)" strokeWidth="0.8" strokeDasharray="2 4" />
      )}

      {/* аспекты */}
      <circle cx={C} cy={C} r={R_ASPECT} fill="var(--surface)" stroke="var(--line)" strokeWidth="0.8" />
      {chart.aspects.map((a) => {
        if (a.kind === "conjunction") return null;
        const pa = chart.planets.find((p) => p.body === a.a)!;
        const pb = chart.planets.find((p) => p.body === a.b)!;
        const [x1, y1] = pt(pa.lon, asc, R_ASPECT);
        const [x2, y2] = pt(pb.lon, asc, R_ASPECT);
        const tense = aspectNature(a.kind) === "tense";
        const opacity = Math.max(0.25, 1 - a.orb / 9);
        return <line key={`${a.a}-${a.b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tense ? "var(--gold)" : "var(--accent)"} strokeWidth={tense ? 1 : 1.1} strokeDasharray={tense ? "3 3" : undefined} opacity={opacity} />;
      })}

      {/* планеты */}
      {chart.planets.map((p, i) => {
        const [tx, ty] = pt(p.lon, asc, R_HOUSE_IN - (cusps ? 2 : 0));
        const [gx, gy] = pt(shown[i], asc, R_PLANET);
        const [lx, ly] = pt(p.lon, asc, R_ASPECT + 2);
        return (
          <g key={p.body}>
            <line x1={tx} y1={ty} x2={gx} y2={gy} stroke="var(--line)" strokeWidth="0.6" />
            <line x1={lx} y1={ly} x2={lx} y2={ly} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" fontSize="17" fill="var(--ink)" fontFamily={GLYPH_FONT}>{PLANET_GLYPH[p.body]}</text>
            {p.retrograde && <text x={gx + 8} y={gy - 7} fontSize="7" fill="var(--muted)" fontFamily="ui-monospace, monospace">R</text>}
          </g>
        );
      })}
    </svg>
  );
}
