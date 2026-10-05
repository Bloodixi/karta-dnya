/** Звёздное небо для тёмных секций: ~90 звёзд по детерминированной спирали, три группы мерцают с разной фазой. */
export default function Starfield({ className = "" }: { className?: string }) {
  const stars = Array.from({ length: 90 }, (_, i) => ({
    x: (i * 137.508 * 7.3) % 1600,
    y: (i * 97.31 * 3.7) % 800,
    r: 0.6 + ((i * 11) % 7) * 0.22,
    g: i % 3,
  }));
  return (
    <svg className={`starfield ${className}`.trim()} viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {[0, 1, 2].map((g) => (
        <g key={g} className={`twinkle twinkle-${g}`}>
          {stars.filter((s) => s.g === g).map((s, i) => (
            <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)} fill="#f3e7c9" />
          ))}
        </g>
      ))}
    </svg>
  );
}
