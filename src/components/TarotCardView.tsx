import CardBack from "./CardBack";

type Props = {
  slug: string;
  name: string;
  reversed?: boolean;
  /** Показать рубашкой вверх (переворот делается сменой класса, см. .tcard в globals.css). */
  faceDown?: boolean;
  /** Один раз перевернуть рубашка → лицо при появлении на странице. */
  flipIn?: boolean;
  priority?: boolean;
  className?: string;
  /** Ширины отрисовки для srcset; для миниатюр передавайте узкие значения. */
  sizes?: string;
};

/** Карта Таро: иллюстрация колоды Райдера–Уэйта (1909, общественное достояние) в золотой рамке, с рубашкой на обороте. */
export default function TarotCardView({ slug, name, reversed = false, faceDown = false, flipIn = false, priority = false, className = "", sizes = "(min-width: 768px) 280px, 60vw" }: Props) {
  return (
    <div className={`tcard ${faceDown ? "is-down" : ""} ${flipIn ? "flip-in" : ""} ${className}`.trim()}>
      <div className="tcard-inner">
        <div className="tcard-face">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image без оптимизации не даёт srcset */}
          <img
            src={`/cards/${slug}.webp`}
            srcSet={`/cards/${slug}-160.webp 160w, /cards/${slug}.webp 320w, /cards/${slug}@2x.webp 640w`}
            sizes={sizes}
            width={320}
            height={553}
            alt={`Карта Таро «${name}»${reversed ? ", перевёрнутая" : ""}`}
            className={reversed ? "rotate-180" : ""}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
          />
        </div>
        <div className="tcard-back">
          <CardBack className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
