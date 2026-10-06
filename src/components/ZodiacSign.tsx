const ELEMENT: Record<string, { from: string; to: string }> = {
  "Огонь": { from: "#d9a48f", to: "#7a4a4a" },
  "Земля": { from: "#b7c7b0", to: "#4d6450" },
  "Воздух": { from: "#cfc3e3", to: "#5f5280" },
  "Вода": { from: "#a9c3d2", to: "#3f5a73" },
};

/** Медальон знака: цвет стихии, золотое кольцо и глиф. Один вид на всех платформах, без эмодзи. */
export default function ZodiacSign({ symbol, element, slug, size = 64, className = "" }: { symbol: string; element: string; slug: string; size?: number; className?: string }) {
  const c = ELEMENT[element] || ELEMENT["Воздух"];
  const id = `zs-${slug}`;
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
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="46" fill="#f6f3fa" fontFamily="'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',serif" style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.25)", strokeWidth: 1 }}>
        {symbol}{"︎"}
      </text>
    </svg>
  );
}
