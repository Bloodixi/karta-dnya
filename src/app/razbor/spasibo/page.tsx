import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { CopyLinkButton, PaymentWaiter } from "@/components/RazborClient";
import RazborPaidGoal from "@/components/RazborPaidGoal";
import { orderState, orderStateLimiter, PAY_COOKIE, type OrderState } from "@/lib/razborOrder";
import { PRODUCTS } from "@/lib/razborProducts";
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
    return { status: "unknown" } as OrderState;
  });
  const canceled = state.status === "canceled";
  const refunded = state.status === "refunded";
  // номера нет, он битый или такого заказа нет ни в файлах, ни в ЮKassa — не ждём впустую
  const missing = !order || Boolean(state.missing);
  const waiting = !missing && (state.status === "pending" || state.status === "unknown");

  const product = state.product ?? "razbor";
  // форма продукта, заполненная из заказа: даты, имена, подарок, пакет
  const resume = state.resume ?? `${PRODUCTS[product].path}#oplata`;
  if (state.status === "paid" && state.path) {
    const url = `${SITE.url}${state.short ?? state.path}`;
    const head =
      product === "compat"
        ? { h1: "Оплата прошла, совместимость готова", lead: "Спасибо! Совместимость вашей пары открывается по ссылке ниже.", open: "Открыть совместимость" }
        : product === "child"
          ? { h1: "Оплата прошла, детский разбор готов", lead: "Спасибо! Детский разбор открывается по ссылке ниже.", open: "Открыть детский разбор" }
          : product === "cert"
            ? { h1: "Оплата прошла, сертификат готов", lead: "Спасибо! Сертификат на разбор открывается по ссылке ниже: получатель введёт свою дату рождения и имя и сразу получит разбор.", open: "Открыть сертификат" }
          : product === "pack"
            ? { h1: "Оплата прошла, разбор и совместимость готовы", lead: "Спасибо! В заказе два документа: разбор по дате рождения и совместимость пары — у каждого своя ссылка.", open: "Открыть разбор" }
            : { h1: "Оплата прошла, разбор готов", lead: state.gift ? "Спасибо! Подарочный разбор открывается по ссылке ниже." : "Спасибо! Твой личный разбор открывается по ссылке ниже.", open: "Открыть разбор" };
    // цель оплаты — только если на сайте есть счётчик; отправляет скрытый iframe, сама страница без Метрики
    const goal = /^\d+$/.test(process.env.METRIKA_ID ?? "") && state.amount && state.amount > 0;
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="card p-6 md:p-8">
          <h1 className="text-3xl">{head.h1}</h1>
          <p className="mt-3 text-muted">{head.lead}</p>
          <p className="mt-4 break-all rounded-lg border border-line bg-surface px-3 py-2 mono-text text-sm">{url}</p>
          {state.pair ? <p className="mt-2 break-all rounded-lg border border-line bg-surface px-3 py-2 mono-text text-sm">{`${SITE.url}${state.pair}`}</p> : null}
          <p className="mt-3 font-medium">{state.pair ? "Сохрани обе ссылки: документы открываются по ним на любом устройстве и в любой момент." : "Сохрани эту ссылку: она открывается на любом устройстве и в любой момент."} {state.pair ? "Копии ссылок" : "Копию ссылки"} и чек об оплате мы отправили на e-mail, указанный при оплате.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={state.short ?? state.path} className="btn">{head.open}</Link>
            {state.pair ? <Link href={state.pair} className="btn">Открыть совместимость</Link> : null}
            <CopyLinkButton url={state.short ?? state.path} />
          </div>
          {state.gift ? <GiftNote gift={state.gift} link={state.short ?? state.path} /> : null}
          {state.upsell ? (
            <div className="mt-5 rounded-lg border border-line p-4">
              <p className="mono">Для двоих</p>
              <p className="mt-1">Совместимость с близким — {PRODUCTS.compat.price} ₽: образ вашей пары, любовь, быт, споры и общий год по двум датам рождения.</p>
              <p className="mt-3">
                <Link href={state.upsell} className="btn btn-ghost">Посмотреть совместимость</Link>
              </p>
            </div>
          ) : null}
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
            <p className="mt-3 text-muted">Деньги не списаны. Можно попробовать ещё раз — бесплатная часть и форма оплаты ждут на странице заказа.</p>
            <p className="mt-5">
              <Link href={resume} className="btn">Вернуться к оплате</Link>
            </p>
          </>
        ) : waiting ? (
          <>
            <h1 className="text-3xl">Ждём подтверждение оплаты</h1>
            <p className="mt-3 text-muted">Обычно это занимает несколько секунд. Как только банк подтвердит платёж, разбор откроется сам.</p>
            <PaymentWaiter order={order} fallback={<Stuck order={order} />} />
            <p className="mt-5 text-sm text-muted">
              Не завершили оплату? <Link href={resume} className="text-accent-text underline">Вернуться к оплате</Link>
            </p>
          </>
        ) : missing ? (
          <>
            <h1 className="text-3xl">Заказ не найден</h1>
            <p className="mt-3 text-muted">
              {order ? "Не нашли заказ по этой ссылке — возможно, в адресе опечатка." : "В ссылке нет номера заказа."} Бесплатная часть и форма оплаты ждут на странице продукта.
            </p>
            <p className="mt-5 flex flex-wrap gap-2">
              <Link href={`${PRODUCTS.razbor.path}#oplata`} className="btn">К разбору по дате рождения</Link>
              <Link href={`${PRODUCTS.compat.path}#oplata`} className="btn btn-ghost">К совместимости пары</Link>
              <Link href={`${PRODUCTS.child.path}#oplata`} className="btn btn-ghost">К детскому разбору</Link>
            </p>
            <p className="mt-4 text-sm text-muted">
              Уже оплатил(а), а ссылка потерялась? Её можно запросить на e-mail внизу <Link href="/razbor#dostup" className="underline hover:text-ink">страницы разбора</Link>.
            </p>
            {order ? <Stuck order={order} /> : null}
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
