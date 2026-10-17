/** Иероглиф животного китайского гороскопа в круглой рамке: в той же сдержанной манере, что медальоны знаков. */
export default function HanziMark({ hanzi, size = "md", className = "" }: { hanzi: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const box = size === "lg" ? "w-20 h-20 text-4xl" : size === "sm" ? "w-10 h-10 text-lg" : "w-14 h-14 text-2xl";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-gold bg-surface text-gold ${box} ${className}`.trim()}
      style={{ fontFamily: "'Noto Serif SC','Songti SC','SimSun',serif" }}
    >
      {hanzi}
    </span>
  );
}
