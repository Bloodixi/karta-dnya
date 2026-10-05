/** Рубашка карты: ночное небо, золотая рамка, месяц и кольцо звёзд. Чистый SVG, масштабируется под любой размер. */
export default function CardBack({ className = "" }: { className?: string }) {
  const stars = Array.from({ length: 26 }, (_, i) => {
    const a = (i * 137.508 * Math.PI) / 180;
    const r = 22 + ((i * 53) % 95);
    return { x: 125 + Math.cos(a) * r * 0.75, y: 200 + Math.sin(a) * r * 1.35, s: 0.8 + ((i * 7) % 5) * 0.35 };
  });
  return (
    <svg viewBox="0 0 250 400" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="cb-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#241b4a" />
          <stop offset="1" stopColor="#120d26" />
        </linearGradient>
        <radialGradient id="cb-glow" cx="0.5" cy="0.42" r="0.5">
          <stop offset="0" stopColor="#b8892b" stopOpacity="0.35" />
          <stop offset="1" stopColor="#b8892b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="250" height="400" rx="14" fill="url(#cb-bg)" />
      <rect width="250" height="400" rx="14" fill="url(#cb-glow)" />
      <rect x="10" y="10" width="230" height="380" rx="9" fill="none" stroke="#d9b45a" strokeWidth="1.5" />
      <rect x="18" y="18" width="214" height="364" rx="6" fill="none" stroke="#d9b45a" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.8" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.s} fill="#f3e7c9" opacity={0.45 + ((i * 3) % 4) * 0.13} />
      ))}
      <circle cx="125" cy="200" r="58" fill="none" stroke="#d9b45a" strokeWidth="1" opacity="0.9" />
      <circle cx="125" cy="200" r="66" fill="none" stroke="#d9b45a" strokeWidth="0.5" opacity="0.5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <path key={i} d="M0 -4 L1.2 -1.2 L4 0 L1.2 1.2 L0 4 L-1.2 1.2 L-4 0 L-1.2 -1.2 Z" fill="#f3e7c9" transform={`translate(${(125 + Math.cos(a) * 66).toFixed(1)} ${(200 + Math.sin(a) * 66).toFixed(1)})`} />;
      })}
      <circle cx="125" cy="200" r="34" fill="#f3e7c9" />
      <circle cx="139" cy="192" r="31" fill="url(#cb-bg)" />
      <circle cx="139" cy="192" r="31" fill="#1a1338" />
      {[[40, 40], [210, 40], [40, 360], [210, 360]].map(([x, y], i) => (
        <path key={i} d="M0 -9 L3 -3 L9 0 L3 3 L0 9 L-3 3 L-9 0 L-3 -3 Z" fill="#d9b45a" transform={`translate(${x} ${y})`} />
      ))}
    </svg>
  );
}
