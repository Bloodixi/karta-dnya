import { readJsonData } from "@/lib/content";
import { SITE } from "@/lib/site";

/** Выпуск «Знакомство с картами»: content/data/card-videos.json собирает /home/proect/tools/site/card-videos.py. */
export type CardVideo = {
  slug: string;
  name: string;
  date: string; // день выхода, ролики выходят в 07:00 МСК
  title: string;
  description: string;
  youtube: string | null;
  vk: { oid: number; id: number; hash: string } | null;
  cover: boolean;
};

const releasedAt = (v: CardVideo) => new Date(`${v.date}T07:00:00+03:00`);

/** Вышедший выпуск про карту: будущие лежат в файле заранее, но до 07:00 МСК своего дня не показываются. */
export function findCardVideo(slug: string, now = new Date()): CardVideo | null {
  const all = readJsonData<CardVideo[]>("card-videos.json", []);
  return all.filter((v) => v.slug === slug && releasedAt(v) <= now).sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

/** Плеер ВК — основной: в России открывается без VPN, в отличие от YouTube. */
export const vkEmbed = (v: CardVideo) => (v.vk ? `https://vkvideo.ru/video_ext.php?oid=${v.vk.oid}&id=${v.vk.id}&hash=${v.vk.hash}&hd=2&autoplay=1` : null);
export const vkWatch = (v: CardVideo) => (v.vk ? `https://vkvideo.ru/video${v.vk.oid}_${v.vk.id}` : null);
export const youtubeWatch = (v: CardVideo) => (v.youtube ? `https://www.youtube.com/watch?v=${v.youtube}` : null);
export const coverUrl = (v: CardVideo) => (v.cover ? `/video/${v.slug}.webp` : `/cards/${v.slug}@2x.webp`);

export function videoJsonLd(v: CardVideo) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.description,
    thumbnailUrl: `${SITE.url}${coverUrl(v)}`,
    uploadDate: releasedAt(v).toISOString(),
    inLanguage: "ru",
    ...(v.vk ? { embedUrl: vkEmbed(v)!.replace("&autoplay=1", "") } : {}),
    ...(v.youtube || v.vk ? { url: (youtubeWatch(v) ?? vkWatch(v))! } : {}),
  };
}
