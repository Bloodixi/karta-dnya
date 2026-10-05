import type { StoneImage } from "@/lib/content";

/** Фото камня с Wikimedia Commons и обязательной подписью автора и лицензии (CC BY / CC BY-SA / PD). */
export default function StonePhoto({ img, name, priority = false, className = "" }: { img: StoneImage; name: string; priority?: boolean; className?: string }) {
  return (
    <figure className={className}>
      <div className="frame-gold rounded-2xl overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image без оптимизации не даёт srcset */}
        <img src={img.file} srcSet={`${img.thumb} 400w, ${img.file} 800w`} sizes="(min-width: 768px) 360px, 90vw" width={800} height={600} alt={`${name}: фото камня`} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className="w-full h-auto block" />
      </div>
      <figcaption className="text-xs text-muted mt-2">
        Фото: <a href={img.source} className="underline hover:text-ink" rel="nofollow noopener" target="_blank">{img.author}</a>, {img.license}, Wikimedia Commons
      </figcaption>
    </figure>
  );
}
