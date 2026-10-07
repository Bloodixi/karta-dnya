import type { SVGProps } from "react";

export type IconName = "card" | "sun" | "hash" | "moon" | "hearts" | "sunrise" | "ball" | "calendar" | "candle" | "gem" | "star" | "rune" | "menu" | "close";

const PATHS: Record<IconName, React.ReactNode> = {
  card: (<><rect x="5" y="2.5" width="14" height="19" rx="2.5" /><path d="M12 8l1.4 2.9 3.1.4-2.3 2.2.6 3.1L12 15.1 9.2 16.6l.6-3.1-2.3-2.2 3.1-.4z" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>),
  hash: (<path d="M9 3 7 21M17 3l-2 18M3 9h18M3 15h18" />),
  moon: (<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" />),
  hearts: (<><path d="M9.5 19s-6-4.1-6-8.3A3.3 3.3 0 0 1 9.5 8.5a3.3 3.3 0 0 1 6 2.2c0 4.2-6 8.3-6 8.3z" /><path d="M15.5 6.2A2.6 2.6 0 0 1 20 8c0 2.4-2.4 4.4-3.5 5.2" /></>),
  sunrise: (<><path d="M3 18h18M12 6V3M5.6 9.6 3.5 7.5M18.4 9.6l2.1-2.1" /><path d="M6 18a6 6 0 0 1 12 0" /></>),
  ball: (<><circle cx="12" cy="10" r="7" /><path d="M8 20h8M9 17h6" /><path d="M9 7.5a3.5 3.5 0 0 1 3-2" /></>),
  calendar: (<><rect x="3" y="4.5" width="18" height="16.5" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /><path d="M14.5 16.8A3 3 0 0 1 11.2 13a2.3 2.3 0 1 0 3.3 3.8z" /></>),
  candle: (<><path d="M9 11h6v10H9z" /><path d="M12 11V8" /><path d="M12 2.5c-1.5 2-2 3-2 4a2 2 0 0 0 4 0c0-1-.5-2-2-4z" /></>),
  gem: (<><path d="M7 3h10l4 5-9 13L3 8z" /><path d="M3 8h18M9.5 8 12 21 14.5 8M7 3l2.5 5M17 3l-2.5 5" /></>),
  rune: (<><path d="M8 3v18" /><path d="M8 9l8-5.5M8 16l8-5.5" /></>),
  star: (<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z" />),
  menu: (<path d="M4 7h16M4 12h16M4 17h10" />),
  close: (<path d="M6 6l12 12M18 6 6 18" />),
};

/** Линейные иконки в одном стиле вместо эмодзи: одинаково выглядят на всех устройствах и красятся через currentColor. */
export default function Icon({ name, size = 22, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {PATHS[name]}
    </svg>
  );
}

export function IconBadge({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <span className={`icon-badge ${className}`.trim()}>
      <Icon name={name} />
    </span>
  );
}
