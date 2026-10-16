import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reviewSigOk } from "@/lib/razborReview";
import { isOrderId } from "@/lib/razborOrder";
import { getOrder } from "@/lib/razborStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Отзыв о разборе",
  description: "Оценка и пара строк о разборе по дате рождения на сайте «Карта дня». Страница доступна только по ссылке из письма покупателю.",
  robots: { index: false, follow: false },
};

const FIELD = "border border-line rounded-lg px-3 py-2 bg-surface min-w-0 w-full";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Форма отзыва по подписанной ссылке из письма (razborReview.reviewUrl). Отзыв можно отправить повторно — он обновится. */
export default async function ReviewPage({ searchParams }: PageProps<"/razbor/otzyv">) {
  const sp = await searchParams;
  const id = one(sp.o);
  const sig = one(sp.s);
  if (!isOrderId(id) || !sig || !reviewSigOk(id, sig)) notFound();
  const order = await getOrder(id);
  if (!order || order.status !== "paid") notFound();
  const r = order.review;
  const sent = one(sp.ok) === "1";
  const err = one(sp.err);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl">Отзыв о разборе</h1>
      {sent ? (
        <div className="card p-5 mt-6">
          <p className="display text-xl">Спасибо, отзыв получен</p>
          <p className="mt-2 text-muted">Мы читаем каждый отзыв и по ним правим тексты. Если захочешь что-то дополнить — эта страница остаётся открытой по ссылке из письма.</p>
          <p className="mt-4">
            <Link href={`/r/${id}`} className="text-accent underline">Открыть свой документ</Link>
          </p>
        </div>
      ) : (
        <form action="/api/razbor/review" method="post" className="card p-5 mt-6 grid gap-5">
          <input type="hidden" name="o" value={id} />
          <input type="hidden" name="s" value={sig} />
          <fieldset>
            <legend className="mono mb-2">Оценка</legend>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="chip cursor-pointer !text-sm has-[:checked]:!bg-accent has-[:checked]:!border-accent has-[:checked]:!text-white">
                  <input type="radio" name="stars" value={n} required defaultChecked={r?.stars === n} className="sr-only" />
                  {"★".repeat(n)}
                </label>
              ))}
            </div>
            {err === "stars" ? <p className="text-sm text-accent mt-2">Выбери оценку от одной до пяти звёзд.</p> : null}
          </fieldset>
          <label className="grid gap-1">
            <span className="mono">Что совпало, что пригодилось, чего не хватило</span>
            <textarea name="text" rows={6} maxLength={1000} defaultValue={r?.text ?? ""} className={FIELD} placeholder="Пара строк — своими словами" />
          </label>
          <label className="grid gap-1">
            <span className="mono">Как подписать отзыв</span>
            <input type="text" name="name" maxLength={40} defaultValue={r?.name ?? ""} className={FIELD} placeholder="Например, Анна, Казань" />
          </label>
          <label className="flex gap-2 items-start text-sm">
            <input type="checkbox" name="publish" value="1" defaultChecked={r?.publish ?? false} className="mt-1" />
            <span>Можно показать отзыв на сайте с этой подписью. Без отметки отзыв читаем только мы.</span>
          </label>
          <button type="submit" className="btn justify-self-start">Отправить отзыв</button>
        </form>
      )}
    </div>
  );
}
