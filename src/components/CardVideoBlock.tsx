import CardVideo from "@/components/CardVideo";
import JsonLd from "@/components/JsonLd";
import { coverUrl, findCardVideo, videoJsonLd, vkEmbed, vkWatch, youtubeWatch } from "@/lib/cardVideo";

/** Вышедший выпуск про карту (или ничего) + VideoObject для выдачи. */
export default function CardVideoBlock({ slug, className }: { slug: string; className?: string }) {
  const v = findCardVideo(slug);
  if (!v) return null;
  return (
    <>
      <CardVideo title={v.title} cover={coverUrl(v)} vkEmbed={vkEmbed(v)} vkWatch={vkWatch(v)} youtube={youtubeWatch(v)} counter={process.env.METRIKA_ID} className={className} />
      <JsonLd data={videoJsonLd(v)} />
    </>
  );
}
