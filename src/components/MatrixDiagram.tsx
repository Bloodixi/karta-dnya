import type { Matrix } from "@/lib/matrix";

/** Упрощённая схема матрицы: четыре точки по краям и центр. Серверный SVG без состояния. */
export default function MatrixDiagram({ m, label }: { m: Matrix; label: string }) {
  const pts: { k: string; v: number; x: number; y: number }[] = [
    { k: "A", v: m.a, x: 50, y: 150 },
    { k: "B", v: m.b, x: 150, y: 50 },
    { k: "C", v: m.c, x: 250, y: 150 },
    { k: "D", v: m.d, x: 150, y: 250 },
    { k: "E", v: m.e, x: 150, y: 150 },
  ];
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label={label} className="w-full max-w-xs mx-auto">
      <g fill="none" stroke="var(--line, currentColor)" strokeWidth="1.5" opacity="0.7">
        <rect x="50" y="50" width="200" height="200" />
        <polygon points="150,50 250,150 150,250 50,150" />
        <line x1="50" y1="150" x2="250" y2="150" />
        <line x1="150" y1="50" x2="150" y2="250" />
      </g>
      {pts.map((p) => (
        <g key={p.k}>
          <circle cx={p.x} cy={p.y} r={p.k === "E" ? 30 : 24} fill="var(--surface, #fff)" stroke="var(--accent, currentColor)" strokeWidth={p.k === "E" ? 2.5 : 1.5} />
          <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize={p.k === "E" ? 20 : 17} fill="var(--ink, currentColor)" fontWeight="600">{p.v}</text>
          <text x={p.x + (p.k === "C" ? 0 : p.k === "A" ? 0 : 0)} y={p.k === "B" ? p.y - 30 : p.k === "D" ? p.y + 42 : p.k === "E" ? p.y + 46 : p.y - 30} textAnchor="middle" fontSize="12" fill="var(--muted, currentColor)">{p.k}</text>
        </g>
      ))}
    </svg>
  );
}
