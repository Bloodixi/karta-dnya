/** Знаки Старшего Футарка: линии в сетке 40×60 (рисуются прямыми, как резали на дереве и камне). */
const GLYPHS: Record<string, string> = {
  fehu: "M6 0V60 M6 24L32 2 M6 44L32 22",
  uruz: "M6 60V0 L34 16 V60",
  thurisaz: "M6 0V60 M6 14L32 30L6 46",
  ansuz: "M6 0V60 M6 10L32 24 M6 28L32 42",
  raido: "M6 0V60 M6 0L32 15L6 30L34 58",
  kenaz: "M32 8L8 30L32 52",
  gebo: "M4 4L36 56 M36 4L4 56",
  wunjo: "M6 0V60 M6 0L32 15L6 30",
  hagalaz: "M6 0V60 M34 0V60 M6 20L34 40",
  nauthiz: "M20 0V60 M6 20L34 40",
  isa: "M20 0V60",
  jera: "M24 4L8 18L24 32 M16 28L32 42L16 56",
  eihwaz: "M20 0V60 M20 0L34 12 M20 60L6 48",
  perthro: "M6 0V60 M6 0L30 14L16 30L30 46L6 60",
  algiz: "M20 0V60 M20 30L6 8 M20 30L34 8",
  sowilo: "M30 2L10 22L30 38L10 58",
  tiwaz: "M20 0V60 M4 20L20 0L36 20",
  berkana: "M6 0V60 M6 0L30 15L6 30L32 45L6 60",
  ehwaz: "M6 0V60 M34 0V60 M6 0L20 16L34 0",
  mannaz: "M6 0V60 M34 0V60 M6 0L34 30 M34 0L6 30",
  laguz: "M8 0V60 M8 0L32 22",
  inguz: "M20 4L34 30L20 56L6 30Z",
  othala: "M20 4L34 22L10 56 M20 4L6 22L30 56",
  dagaz: "M5 4V56 M35 4V56 M5 4L35 56 M35 4L5 56",
};

const ATT_COLORS: Record<number, { from: string; to: string }> = {
  1: { from: "#d9a48f", to: "#7a4a4a" },
  2: { from: "#a9c3d2", to: "#3f5a73" },
  3: { from: "#b7c7b0", to: "#4d6450" },
};

/** Медальон руны: цвет по атту (ряду Футарка), золотое кольцо и знак. Без шрифтов и эмодзи. */
export default function RuneGlyph({ slug, att, size = 64, className = "" }: { slug: string; att: number; size?: number; className?: string }) {
  const c = ATT_COLORS[att] || ATT_COLORS[1];
  const id = `rg-${att}`;
  const d = GLYPHS[slug];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={c.from} />
          <stop offset="1" stopColor={c.to} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#b5ab97" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#ece9f1" strokeWidth="0.6" strokeDasharray="1.5 4" opacity="0.7" />
      {d && (
        <path d={d} transform="translate(50 50) scale(0.78) translate(-20 -30)" fill="none" stroke="#f6f3fa" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
