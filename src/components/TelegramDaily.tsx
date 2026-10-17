import GoalLink from "@/components/GoalLink";
import Icon from "@/components/Icons";
import { SOCIAL } from "@/lib/site";

/**
 * Приглашение в Telegram-канал после основного ответа страницы: одна строка пользы и кнопка.
 * `campaign` — utm_campaign (по нему в Метрике видно, какая страница приводит подписчиков),
 * `text` — польза для этой страницы; по умолчанию — общая.
 */
export default function TelegramDaily({
  campaign,
  text = "Карта дня, настроение знаков и Луна — в 8:00 по Москве, коротко и без рекламы.",
  className = "mt-10",
}: {
  campaign: string;
  text?: string;
  className?: string;
}) {
  const href = `${SOCIAL.telegram.url}?utm_source=site&utm_medium=telegram_daily&utm_campaign=${encodeURIComponent(campaign)}`;
  return (
    <aside aria-label="Подписка на Telegram" className={`card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 ${className}`.trim()}>
      <div className="flex-1 min-w-0">
        <p className="display text-lg leading-snug">Каждое утро — в Telegram</p>
        <p className="text-muted text-sm mt-1">{text}</p>
      </div>
      <GoalLink href={href} goal="subscribe_telegram" counter={process.env.METRIKA_ID} className="btn shrink-0 self-start sm:self-auto inline-flex items-center gap-2">
        <Icon name="send" size={18} />
        Подписаться
      </GoalLink>
    </aside>
  );
}
