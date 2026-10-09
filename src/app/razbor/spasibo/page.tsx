import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PaymentWaiter } from "@/components/RazborClient";
import { findPayment, PAY_COOKIE, razborPath } from "@/lib/razborOrder";
import { SELLER } from "@/lib/site";

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
      Если оплата прошла, а разбор не открылся, напиши нам
      {email ? (
        <>
          {" "}на <a href={`mailto:${email}?subject=${encodeURIComponent(`Разбор, заказ ${order}`)}`} className="text-accent underline">{email}</a>
        </>
      ) : null}
      , приложив номер заказа <span className="mono-text text-ink">{order || "—"}</span>. Мы пришлём ссылку или вернём оплату.
    </p>
  );
}

export default async function RazborThanksPage({ searchParams }: PageProps<"/razbor/spasibo">) {
  const sp = await searchParams;
  const order = (Array.isArray(sp.o) ? sp.o[0] : sp.o)?.slice(0, 64) ?? "";
  const cookiePayment = (await cookies()).get(PAY_COOKIE)?.value;
  const payment = order ? await findPayment(order, cookiePayment) : null;

  if (payment?.status === "succeeded") {
    const path = razborPath(payment);
    if (path) redirect(path);
  }

  const waiting = payment?.status === "pending" || payment?.status === "waiting_for_capture";
  const canceled = payment?.status === "canceled";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="card p-6 md:p-8">
        {canceled ? (
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
            <PaymentWaiter fallback={<Stuck order={order} />} />
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
