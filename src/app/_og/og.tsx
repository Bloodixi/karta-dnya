import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";

/** Общие части OG-картинок (1200×630): шрифты, рамка, подпись сайта. Рендерится satori, поэтому только flex и простые стили. */
export const OG_SIZE = { width: 1200, height: 630 };

export async function ogFonts() {
  const dir = join(process.cwd(), "src", "app", "_og");
  const [display, sans, mono] = await Promise.all([readFile(join(dir, "prata.ttf")), readFile(join(dir, "golos-text.ttf")), readFile(join(dir, "ibm-plex-mono.ttf"))]);
  return [
    { name: "Prata", data: display, weight: 400 as const, style: "normal" as const },
    { name: "Golos", data: sans, weight: 500 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

export async function cardDataUrl(slug: string): Promise<string> {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("bad slug");
  const buf = await readFile(join(process.cwd(), "public", "cards", `${slug}-og.jpg`));
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** Любая jpg-картинка из public как data URL (для satori: webp не поддерживается). */
export async function publicJpgDataUrl(rel: string): Promise<string | null> {
  // Только простые пути вида /dreams/<slug>-og.jpg: никаких «..», абсолютных путей и спецсимволов.
  if (!/^\/[a-z0-9-]+\/[a-z0-9-]+\.jpg$/.test(rel)) return null;
  try {
    const buf = await readFile(join(process.cwd(), "public", ...rel.split("/").filter(Boolean)));
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export const C = { bg: "#1b1b1f", bg2: "#242428", ink: "#ece9f1", muted: "#aeacb6", gold: "#b5ab97", cream: "#e6e0ee", accent: "#b3a2cc" };

export function Stars() {
  const stars = Array.from({ length: 70 }, (_, i) => ({ x: (i * 137.508 * 7.3) % 1200, y: (i * 97.31 * 3.7) % 630, r: 1 + ((i * 11) % 5) * 0.5, o: 0.35 + ((i * 3) % 4) * 0.15 }));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex" }}>
      {stars.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: 99, background: C.cream, opacity: s.o }} />
      ))}
    </div>
  );
}

export function Frame({ children, kicker = "karta-dnya.ru" }: { children: ReactNode; kicker?: string }) {
  return (
    <div style={{ width: 1200, height: 630, display: "flex", position: "relative", background: `linear-gradient(135deg, ${C.bg2} 0%, ${C.bg} 60%, #120d26 100%)`, color: C.ink, fontFamily: "Golos" }}>
      
      <div style={{ position: "absolute", left: 24, top: 24, width: 1152, height: 582, border: `2px solid ${C.gold}`, borderRadius: 6, display: "flex" }} />
      <div style={{ position: "absolute", left: 34, top: 34, width: 1132, height: 562, border: `1px solid ${C.gold}`, opacity: 0.45, borderRadius: 4, display: "flex" }} />
      <div style={{ position: "absolute", left: 64, top: 52, display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: C.cream }}>
        <div style={{ display: "flex", width: 14, height: 14, background: C.gold, transform: "rotate(45deg)", marginRight: 6 }} />
        <span style={{ fontFamily: "Prata", fontSize: 34 }}>Карта дня</span>
        <span style={{ color: C.muted, fontSize: 20, marginLeft: 10, fontFamily: "Mono", textTransform: "uppercase", letterSpacing: "2px" }}>{kicker}</span>
      </div>
      <div style={{ position: "absolute", left: 64, top: 120, width: 1072, height: 454, display: "flex" }}>{children}</div>
    </div>
  );
}

export function Title({ children, size = 64 }: { children: ReactNode; size?: number }) {
  return <div style={{ fontFamily: "Prata", fontSize: size, lineHeight: 1.08, color: C.ink, display: "flex" }}>{children}</div>;
}

export function Sub({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 28, lineHeight: 1.35, color: C.muted, marginTop: 22, display: "flex" }}>{children}</div>;
}

export function Chip({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", padding: "8px 16px", borderRadius: 2, border: `1px solid ${C.muted}`, color: C.cream, fontSize: 20, fontFamily: "Mono", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 22, alignSelf: "flex-start" }}>{children}</div>;
}

/** Луна по возрасту: та же геометрия, что в MoonPhase, но plain SVG без градиентов (satori). */
export function MoonSvg({ age, size = 260 }: { age: number; size?: number }) {
  const SYNODIC = 29.530588853;
  const p = age / SYNODIC, k = Math.cos(2 * Math.PI * p), waxing = p < 0.5, r = 46, rx = Math.max(Math.abs(k) * r, 0.01);
  const limbSweep = waxing ? 1 : 0, termSweep = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
  const lit = `M50 ${50 - r} A${r} ${r} 0 0 ${limbSweep} 50 ${50 + r} A${rx} ${r} 0 0 ${termSweep} 50 ${50 - r} Z`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r={r} fill="#241d45" stroke={C.gold} strokeWidth="1" />
      {k < 0.999 && <path d={lit} fill="#f3e7c9" />}
    </svg>
  );
}
