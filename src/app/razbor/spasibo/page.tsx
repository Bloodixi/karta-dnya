import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { CopyLinkButton, PaymentWaiter } from "@/components/RazborClient";
import RazborPaidGoal from "@/components/RazborPaidGoal";
import { orderState, orderStateLimiter, PAY_COOKIE, type OrderState } from "@/lib/razborOrder";
import { clientIpFromHeaders } from "@/lib/rateLimit";
import { SELLER, SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Оплата разбора",
  description: "Страница подтверждения оплаты нумерологического разбора по дате рождения: после подтверждения платежа разбор откроется автоматически.",
  robots: { index: false, follow: false },
};

function Stuck({ order }: { order: string }) {
  const email = SELLER.email.includes("@") ? SELLER.email : null;
  return (
    <p className="mt-4">
      Если ссылка потеряется или разбор не откроется, напиши нам
      {email ? (
        <>
          {" "}на <a href={`mailto:${email}?subject=${encodeURIComponent(`Разбор, заказ ${order}`)}`} className="text-accent underline">{email}</a>
        </>
      ) : null}
      , приложив номер заказа <span className="mono-text text-ink">{order || "—"}</span>. Мы пришлём ссылку или вернём оплату.
    </p>
  );
}

/** ГГГГ-ММ-ДД → ДД.ММ */
const ddmm = (iso: string) => iso.slice(5).split("-").reverse().join(".");

/** Подарок: когда и куда уйдёт письмо получателю (адрес замаскирован) или «ссылку передаёшь сам». */
function GiftNote({ gift, link }: { gift: NonNullable<OrderState["gift"]>; link: string }) {
  const who = gift.to ? `Получатель: ${gift.to}. ` : "";
  return (
    <div className="mt-5 rounded-lg border border-line bg-surface p-4">
      <p className="mono">Подарок</p>
      {gift.email ? (
        <p className="mt-1">
          {who}
          {gift.sent ? `Письмо с подарком отправлено на ${gift.email}.` : gift.at ? `Письмо с подарком уйдёт ${ddmm(gift.at)} утром на ${gift.email}.` : `Письмо с подарком уходит сейчас на ${gift.email}.`}
        </p>
      ) : (
        <>
          <p className="mt-1">{who}Письмо получателю мы не отправляем — ссылку передаёшь сам(а).</p>
          <div className="mt-3">
            <CopyLinkButton url={link} label="Скопировать ссылку для получателя" />
          </div>
        </>
      )}
    </div>
  );
}

export default async function RazborThanksPage({ searchParams }: PageProps<"/razbor/spasibo">) {
  const sp = await searchParams;
  const order = (Array.isArray(sp.o) ? sp.o[0] : sp.o)?.slice(0, 64) ?? "";
  const cookiePayment = (await cookies()).get(PAY_COOKIE)?.value;
  // тот же лимит по IP, что у /api/razbor/status: сверх него — только файл заказа, без запросов к ЮKassa
  const live = orderStateLimiter().take(clientIpFromHeaders(await headers()));
  const state = await orderState(order, cookiePayment, !live).catch((e) => {
    console.error("razbor spasibo:", order, e);
    return { status: "unknown" as const, path: undefined, short: undefined, receipt: undefined };
  });
  const canceled = state.status === "canceled";
  const refunded = state.status === "refunded";
  const waiting = Boolean(order) && (state.status === "pending" || state.status === "unknown");

  if (state.status === "paid" && state.path) {
    const url = `${SITE.url}${state.short ?? state.path}`;
    // цель оплаты — только если на сайте есть счётчик; отправляет скрытый iframe, сама страница без Метрики
    const goal = /^\d+$/.test(process.env.METRIKA_ID ?? "") && state.amount && state.amount > 0;
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="card p-6 md:p-8">
          <h1 className="text-3xl">Оплата прошла, разбор готов</h1>
          <p className="mt-3 text-muted">{state.gift ? "Спасибо! Подарочный разбор открывается по ссылке ниже." : "Спасибо! Твой личный разбор открывается по ссылке ниже."}</p>
          <p className="mt-4 break-all rounded-lg border border-line bg-surface px-3 py-2 mono-text text-sm">{url}</p>
          <p className="mt-3 font-medium">Сохрани эту ссылку: разбор открывается по ней на любом устройстве и в любой момент. Копию ссылки и чек об оплате мы отправили на e-mail, указанный при оплате.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={state.short ?? state.path} className="btn">Открыть разбор</Link>
            <CopyLinkButton url={state.short ?? state.path} />
          </div>
          {state.gift ? <GiftNote gift={state.gift} link={state.short ?? state.path} /> : null}
          {state.receipt ? (
            <p className="mt-4 text-sm text-muted">
              Чек об оплате: <Link href={state.receipt} className="underline hover:text-ink">открыть чек</Link>
            </p>
          ) : null}
          <Stuck order={order} />
          {goal ? <RazborPaidGoal order={order} amount={state.amount!} /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="card p-6 md:p-8">
        {refunded ? (
          <>
            <h1 className="text-3xl">Оплата возвращена</h1>
            <p className="mt-3 text-muted">По этому заказу оформлен возврат, поэтому ссылка на разбор больше не открывается.</p>
            <p className="mt-5">
              <Link href="/razbor" className="btn btn-ghost">К странице разбора</Link>
            </p>
          </>
        ) : canceled ? (
          <>
            <h1 className="text-3xl">Оплата не прошла</h1>
            <p className="mt-3 text-muted">Деньги не списаны. Можно попробовать ещё раз — бесплатная часть и форма оплаты ждут на странице разбора.</p>
            <p className="mt-5">
              <Link href="/razbor#oplata" className="btn">Вернуться к разбору</Link>
            </p>
          </>
        ) : waiting ? (
          <>
            <h1 className="text-3xl">Ждём подтверждение оплаты</h1>
            <p className="mt-3 text-muted">Обычно это занимает несколько секунд. Как только банк подтвердит платёж, разбор откроется сам.</p>
            <PaymentWaiter order={order} fallback={<Stuck order={order} />} />
          </>
        ) : (
          <>
            <h1 className="text-3xl">Проверяем заказ</h1>
            <Stuck order={order} />
            <p className="mt-5">
              <Link href="/razbor" className="btn btn-ghost">К странице разбора</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
