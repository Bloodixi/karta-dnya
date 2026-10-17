import CardBack from "@/components/CardBack";
import GoalLink from "@/components/GoalLink";
import Icon from "@/components/Icons";
import { SOCIAL } from "@/lib/site";

/**
 * Карта на завтра — закрытая: рубашка, время открытия и напоминание в Telegram.
 * Имя завтрашней карты не показываем: повод вернуться завтра на сайт (или получить её в канале).
 * `tile` — плитка в полосе под героем на главной, `block` — блок под толкованием на /karta-dnya.
 */
export default function TomorrowCard({ campaign, variant = "block", className = "" }: { campaign: string; variant?: "tile" | "block"; className?: string }) {
  const href = `${SOCIAL.telegram.url}?utm_source=site&utm_medium=tomorrow_card&utm_campaign=${encodeURIComponent(campaign)}`;
  const counter = process.env.METRIKA_ID;
  if (variant === "tile") {
    return (
      <div className={`flex items-center gap-4 p-5 ${className}`.trim()}>
        <span className="w-10 shrink-0"><CardBack className="block w-full h-auto rounded-[3px]" /></span>
        <span className="min-w-0">
          <b className="block font-medium">Карта на завтра</b>
          <span className="text-sm text-muted block">Откроется завтра в 00:00 по Москве</span>
          <GoalLink href={href} goal="subscribe_telegram" counter={counter} className="text-sm text-accent-text underline underline-offset-2 hover:text-ink inline-flex items-center gap-1 mt-1">
            <Icon name="send" size={14} />
            Напомнить в Telegram
          </GoalLink>
        </span>
      </div>
    );
  }
  return (
    <div className={`card p-4 flex flex-wrap items-center gap-x-4 gap-y-3 ${className}`.trim()}>
      <span className="w-12 shrink-0"><CardBack className="block w-full h-auto rounded-[3px]" /></span>
      <div className="flex-1 min-w-[12rem]">
        <p className="font-medium">Карта на завтра пока закрыта</p>
        <p className="text-sm text-muted">Откроется завтра в 00:00 по Москве. В Telegram-канале она появится уже вечером.</p>
      </div>
      <GoalLink href={href} goal="subscribe_telegram" counter={counter} className="btn btn-ghost shrink-0 !py-1.5 !px-3 text-sm inline-flex items-center gap-2">
        <Icon name="send" size={16} />
        Напомнить в Telegram
      </GoalLink>
    </div>
  );
}
