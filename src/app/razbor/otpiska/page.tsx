import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { unsubOk } from "@/lib/razborGift";
import { getOrder } from "@/lib/razborStore";
import { pageTitle } from "@/lib/site";

export const dynamic = "force-dynamic";

const PATH = "/razbor/otpiska";

export const metadata: Metadata = {
  title: pageTitle("Отписка от напоминания о прогнозе"),
  description: "Отписка от ежегодного письма о новом прогнозе по дате рождения на сайте «Карта дня». Страница открывается только по личной ссылке из письма покупателю.",
  alternates: { canonical: PATH },
  robots: { index: false, follow: false },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Отписка по подписанной ссылке: сначала кнопка (почтовые сканеры открывают ссылки сами), затем POST. */
export default async function UnsubPage({ searchParams }: PageProps<"/razbor/otpiska">) {
  const sp = await searchParams;
  const id = one(sp.o);
  const s = one(sp.s);
  if (!unsubOk(id, s)) notFound();
  const order = await getOrder(id);
  if (!order) notFound();
  const off = Boolean(order.yearly_off_at) || one(sp.done) === "1";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/razbor", label: "Разбор по дате рождения" }, { href: PATH, label: "Отписка" }]} />
      <h1 className="text-3xl">Напоминание о новом прогнозе</h1>
      <div className="card p-6 mt-6">
        {off ? (
          <>
            <p className="display text-xl">Готово, ты отписан(а)</p>
            <p className="mt-2 text-muted">Писем о новом прогнозе по этому заказу больше не будет. Твой документ по-прежнему открывается по ссылке из первого письма.</p>
          </>
        ) : (
          <>
            <p>При оплате ты отметил(а) «Присылать раз в год напоминание о новом прогнозе». Если оно больше не нужно — отпишись одной кнопкой.</p>
            <form method="post" action="/api/razbor/otpiska" className="mt-4">
              <input type="hidden" name="o" value={id} />
              <input type="hidden" name="s" value={s} />
              <button type="submit" className="btn">Отписаться</button>
            </form>
          </>
        )}
        <p className="mt-4 text-sm">
          <Link href={`/r/${id}`} className="text-accent-text underline">Открыть свой документ</Link> · <Link href="/numerologiya" className="text-accent-text underline">Нумерология на сайте</Link>
        </p>
      </div>
    </div>
  );
}
