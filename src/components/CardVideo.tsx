"use client";

import { useState } from "react";
import GoalLink from "@/components/GoalLink";
import { umamiTrack } from "@/lib/umami";

type Props = { title: string; cover: string; vkEmbed: string | null; vkWatch: string | null; youtube: string | null; counter?: string; className?: string };

/**
 * Выпуск «Знакомство с картами» на странице карты. Сначала только обложка: плеер ВК грузится по нажатию,
 * чтобы не тянуть чужие скрипты на каждую страницу. ВК — основной вариант (в России открывается без VPN),
 * YouTube — второй, ссылкой.
 */
export default function CardVideo({ title, cover, vkEmbed, vkWatch, youtube, counter, className = "" }: Props) {
  const [playing, setPlaying] = useState(false);
  const play = () => {
    umamiTrack("video_vk");
    const ym = (window as unknown as { ym?: (id: number, action: string, goal: string) => void }).ym;
    if (counter && ym) ym(Number(counter), "reachGoal", "video_vk");
    setPlaying(true);
  };
  return (
    <section className={`card overflow-hidden ${className}`.trim()} aria-label="Видео о карте">
      <div className="relative aspect-video bg-[var(--night)]">
        {playing && vkEmbed ? (
          <iframe src={vkEmbed} title={title} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock" allowFullScreen />
        ) : vkEmbed ? (
          <button type="button" onClick={play} className="group absolute inset-0 h-full w-full cursor-pointer" aria-label={`Смотреть во ВКонтакте: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- обложка 960×540 уже сжата, оптимизатор не нужен */}
            <img src={cover} alt="" width={960} height={540} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white transition group-hover:scale-110 group-hover:bg-black/75">
                <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
              </span>
            </span>
          </button>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- см. выше
          <img src={cover} alt="" width={960} height={540} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-4 md:p-5">
        <p className="mono">Видео · Знакомство с картами</p>
        <p className="mt-1 font-medium">{title}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {vkEmbed && !playing && (
            <button type="button" onClick={play} className="btn">Смотреть во ВКонтакте</button>
          )}
          {vkWatch && playing && (
            <GoalLink href={vkWatch} goal="video_vk_open" counter={counter} className="btn btn-ghost">Открыть в ВК Видео</GoalLink>
          )}
          {youtube && (
            <GoalLink href={youtube} goal="video_youtube" counter={counter} className="btn btn-ghost">Смотреть на YouTube</GoalLink>
          )}
        </div>
        {vkEmbed && youtube && <p className="mt-2 text-xs text-muted">Если YouTube не открывается, смотрите во ВКонтакте: там видео идёт без VPN.</p>}
      </div>
    </section>
  );
}
