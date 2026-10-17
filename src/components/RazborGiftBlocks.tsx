import Link from "next/link";
import { IconBadge } from "@/components/Icons";
import { GiftExtraFields } from "@/components/GiftModeFields";
import { PayButtons, RazborCheckoutForm } from "@/components/RazborClient";
import { NY_ANCHOR } from "@/lib/giftSeason";

/**
 * «Подари прогноз на <год> год» на /razbor: с 1 ноября по 7 января (или с ?ny=1). Кнопка ведёт в форму оплаты
 * в режиме подарка с готовым днём отправки (31 декабря или 1 января, 9:00 по Москве).
 */
export function NyGiftBlock({ year, dates, price }: { year: number; dates: { iso: string; label: string }[]; price: number }) {
  const when = dates.map((d) => d.label).join(" или ");
  return (
    <section id={NY_ANCHOR} className="mt-10 max-w-3xl scroll-mt-24" aria-labelledby="ny-gift">
      <div className="card frame-gold p-6">
        <div className="flex items-center gap-3">
          <IconBadge name="star" />
          <p className="mono">Подарок к Новому году</p>
        </div>
        <h2 id="ny-gift" className="display text-2xl mt-3">Подари прогноз на {year} год</h2>
        <p className="mt-3">
          Личный разбор по дате рождения близкого человека: его числа, сильные стороны и тон каждого из двенадцати месяцев {year} года.
          {when ? ` Письмо с подарком придёт ему ${when} в 9 утра по Москве — с твоей подписью и пожеланием.` : " Письмо с подарком можно отправить сразу или в выбранный день — с твоей подписью и пожеланием."}
        </p>
        <ul className="mt-4 grid gap-1.5 text-sm text-muted">
          <li>— Прогноз по месяцам начнётся с января {year} года, если письмо уходит с 25 декабря.</li>
          <li>— Ссылка на разбор и чек сразу придут тебе — подарок можно передать и самому.</li>
          <li>— Не знаешь дату рождения? Подари <a href="#sertifikat" className="text-accent-text underline">сертификат</a>: получатель введёт её сам.</li>
        </ul>
        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={`/razbor?g=1&ny=1#oplata`} className="btn">Подарить за {price} ₽</Link>
          <Link href="/razbor/primer" className="text-sm text-accent-text underline">Пример полного разбора</Link>
        </p>
      </div>
    </section>
  );
}

const ERR_EMAIL = "Укажи свой e-mail — на него придут ссылка на сертификат и чек.";

/**
 * «Не знаешь дату рождения? Подари сертификат»: оплата сертификата (product=cert, цена как у разбора).
 * Получатель по ссылке из письма сам вводит дату и имя (/razbor/sertifikat).
 */
export function CertBlock({ counter, price, today, maxDate, err, errors }: { counter?: string; price: number; today: string; maxDate: string; err?: string; errors: Record<string, string> }) {
  const text = err === "email" ? ERR_EMAIL : err ? errors[err] : undefined;
  return (
    <section id="sertifikat" className="mt-10 max-w-3xl scroll-mt-24" aria-labelledby="cert-gift">
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <IconBadge name="hash" />
          <p className="mono">Подарочный сертификат</p>
        </div>
        <h2 id="cert-gift" className="display text-2xl mt-3">Не знаешь дату рождения? Подари сертификат</h2>
        <p className="mt-3">
          Сертификат на полный разбор — {price} ₽. Получатель откроет ссылку из письма, сам введёт свою дату рождения и имя и сразу получит разбор с прогнозом на двенадцать месяцев с того месяца, когда активирует сертификат.
        </p>
        <details className="mt-4" open={Boolean(err)}>
          <summary className="cursor-pointer text-accent-text underline underline-offset-2 py-2">Оформить сертификат</summary>
          {text ? (
            <p role="alert" className="text-sm mt-3 border-l-2 border-accent pl-3">
              {text}
            </p>
          ) : null}
          <RazborCheckoutForm counter={counter} goal="cert_checkout_click">
            <input type="hidden" name="product" value="cert" />
            <input type="hidden" name="for" value="gift" />
            <GiftExtraFields today={today} maxDate={maxDate} err={err} what="сертификат" note="Сертификат срабатывает один раз и без срока: дату рождения получатель вводит сам." />
            <label className="grid gap-1 text-sm mt-5 max-w-sm">
              Твой e-mail — пришлём сюда ссылку на сертификат и чек
              <input type="email" name="email" required autoComplete="email" maxLength={200} placeholder="you@example.ru" aria-invalid={err === "email" || undefined} className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0" />
            </label>
            <PayButtons price={price} />
            <p className="text-xs text-muted mt-3 max-w-md">
              Нажимая кнопку, ты принимаешь условия <Link href="/oferta" className="underline">оферты</Link>. Оплата через ЮKassa. Разбор носит развлекательный и ознакомительный характер.
            </p>
          </RazborCheckoutForm>
        </details>
      </div>
    </section>
  );
}
