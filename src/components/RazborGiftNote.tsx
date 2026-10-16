import type { GiftView } from "@/lib/razborGift";

/**
 * Плашка на странице подарочного разбора: кому, от кого и пожелание (без e-mail и дат отправки).
 * Имена в форме записаны в именительном падеже, поэтому «Для: Анна · От: Ольга», а не «для Анна». Текст экранирует React.
 */
export default function RazborGiftNote({ gift }: { gift: GiftView }) {
  return (
    <aside className="card frame-gold mt-5 p-5" aria-label="Подарок">
      <p className="mono">Это подарок</p>
      <p className="display text-xl mt-1">
        {gift.to ? <>Для: {gift.to} · </> : null}От: {gift.from}
      </p>
      {gift.wish ? <p className="mt-3 italic whitespace-pre-line">{gift.wish}</p> : null}
    </aside>
  );
}
