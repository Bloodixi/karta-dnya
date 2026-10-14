import GoalLink from "@/components/GoalLink";
import { SOCIAL } from "@/lib/site";

/** Блок подписки на Telegram-канал (и YouTube). campaign — utm_campaign, по нему видно, какая страница приводит подписчиков. */
export default function Subscribe({ campaign, className = "" }: { campaign: string; className?: string }) {
  const counter = process.env.METRIKA_ID;
  const utm = `utm_source=site&utm_medium=subscribe&utm_campaign=${campaign}`;
  return (
    <aside className={`card p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 ${className}`.trim()}>
      <div className="flex-1">
        <p className="display text-xl">Карта дня каждое утро — в Telegram</p>
        <p className="text-muted text-sm mt-1">Карта, настроение знаков и Луна в 8:00 по Москве, вечером — карта на завтра. Коротко и спокойно, без рассылок и рекламы.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <GoalLink href={`${SOCIAL.telegram.url}?${utm}`} goal="subscribe_telegram" counter={counter}
          className="btn">
          Подписаться в Telegram
        </GoalLink>
        <GoalLink href={SOCIAL.youtube.url} goal="subscribe_youtube" counter={counter} className="text-sm text-muted hover:text-ink underline">
          Короткие видео на YouTube
        </GoalLink>
      </div>
    </aside>
  );
}
