const SYNODIC = 29.530588853;

/** Луна по возрасту (дни от новолуния): освещённая часть рисуется геометрически, без эмодзи. */
export default function MoonPhase({ age, size = 96, className = "", title }: { age: number; size?: number; className?: string; title?: string }) {
  const p = age / SYNODIC; // 0 новолуние, 0.5 полнолуние
  const k = Math.cos(2 * Math.PI * p); // 1 → тёмная, −1 → полная
  const waxing = p < 0.5;
  const r = 46;
  const rx = Math.max(Math.abs(k) * r, 0.01);
  // Освещённая область: дуга по лимбу с освещённой стороны и обратно по терминатору (эллипс rx).
  const limbSweep = waxing ? 1 : 0;
  const termSweep = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
  const lit = `M50 ${50 - r} A${r} ${r} 0 0 ${limbSweep} 50 ${50 + r} A${rx} ${r} 0 0 ${termSweep} 50 ${50 - r} Z`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"} focusable="false">
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id="moon-lit" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#f6f3fa" />
          <stop offset="1" stopColor="#cfc3e3" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r={r} fill="#242428" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#b5ab97" strokeWidth="1" opacity="0.6" />
      {k < 0.999 && <path d={lit} fill="url(#moon-lit)" />}
      <circle cx="36" cy="40" r="5" fill="#000" opacity="0.06" />
      <circle cx="58" cy="62" r="7" fill="#000" opacity="0.06" />
      <circle cx="62" cy="34" r="3" fill="#000" opacity="0.06" />
    </svg>
  );
}
