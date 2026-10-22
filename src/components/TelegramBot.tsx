import GoalLink from "@/components/GoalLink";
import Icon from "@/components/Icons";
import { TG_BOT_URL } from "@/lib/site";

/**
 * Приглашение в бота @karta_dnya_ru_bot на страницах чисел: дата рождения → число судьбы и карта дня, совместимость.
 * `from` уходит в /start бота (ref) — по журналу бота видно, какая страница приводит людей.
 */
export default function TelegramBot({
  from,
  title = "Число судьбы и совместимость — в Telegram",
  text = "Напиши боту дату рождения — и сразу получишь своё число, карту дня и совместимость по двум датам. Бесплатно.",
  className = "mt-10",
}: {
  from: string;
  title?: string;
  text?: string;
  className?: string;
}) {
  return (
    <aside aria-label="Бот «Карта дня» в Telegram" className={`card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 ${className}`.trim()}>
      <div className="flex-1 min-w-0">
        <p className="display text-lg leading-snug">{title}</p>
        <p className="text-muted text-sm mt-1">{text}</p>
      </div>
      <GoalLink href={`${TG_BOT_URL}?start=site_${encodeURIComponent(from)}`} goal="open_tg_bot" counter={process.env.METRIKA_ID} className="btn shrink-0 self-start sm:self-auto inline-flex items-center gap-2">
        <Icon name="send" size={18} />
        Открыть бота
      </GoalLink>
    </aside>
  );
}
