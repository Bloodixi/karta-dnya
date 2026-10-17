import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import RazborGiftNote from "@/components/RazborGiftNote";
import { DateField, FormError, TextField } from "@/components/NumerologyFields";
import { certState } from "@/lib/razborCert";
import { readCertCode } from "@/lib/razborGift";
import { cleanName } from "@/lib/numerology";
import { getOrder } from "@/lib/razborStore";
import { RAZBOR } from "@/lib/razbor";
import { pageTitle } from "@/lib/site";

export const dynamic = "force-dynamic";

const PATH = "/razbor/sertifikat";

export const metadata: Metadata = {
  title: pageTitle("Сертификат на разбор по дате рождения"),
  description: "Активация подарочного сертификата на нумерологический разбор: введи свою дату рождения и имя, и полный разбор откроется сразу. Страница доступна по ссылке из письма.",
  alternates: { canonical: PATH },
  robots: { index: false, follow: false },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const ERRORS: Record<string, string> = {
  date: "Проверь дату: нужна настоящая дата рождения, например 17.05.1990.",
  many: "Слишком много попыток подряд. Подожди несколько минут и попробуй ещё раз.",
};

/** Сертификат по подписанной ссылке: получатель сам вводит дату и имя, заказ становится оплаченным разбором. */
export default async function CertPage({ searchParams }: PageProps<"/razbor/sertifikat">) {
  const sp = await searchParams;
  const code = one(sp.c).slice(0, 120);
  const id = readCertCode(code);
  const order = id ? await getOrder(id) : null;
  const state = id ? certState(order) : "missing";
  const err = one(sp.err);
  const g = order?.gift;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/razbor", label: "Разбор по дате рождения" }, { href: PATH, label: "Сертификат" }]} />
      <h1 className="text-3xl md:text-4xl">Сертификат на разбор по дате рождения</h1>

      {state === "ok" ? (
        <>
          {g?.from ? <RazborGiftNote gift={{ to: "", from: g.from, ...(g.wish ? { wish: g.wish } : {}) }} /> : null}
          <p className="text-muted mt-5 text-lg">
            Это подарок: полный нумерологический разбор — числа, квадрат Пифагора, любовь и работа, личный год и прогноз на двенадцать месяцев. Осталось ввести свою дату рождения.
          </p>
          <div className="card p-6 mt-6">
            <form method="post" action="/api/razbor/sertifikat" className="grid gap-4 sm:grid-cols-2 items-end">
              <input type="hidden" name="c" value={code} />
              <DateField name="date" label="Твоя дата рождения" invalid={err === "date"} />
              <TextField name="name" label="Имя (необязательно)" defaultValue={cleanName(sp.n)} placeholder="Например, Анна" />
              <label className="grid gap-1 text-sm sm:col-span-2 max-w-sm">
                E-mail (необязательно) — пришлём постоянную ссылку на разбор
                <input type="email" name="email" maxLength={200} autoComplete="email" placeholder="you@example.ru" className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0 min-h-11" />
              </label>
              <button type="submit" className="btn btn-lg justify-center sm:col-span-2 sm:justify-self-start">Получить разбор</button>
            </form>
            <FormError text={ERRORS[err]} />
            <p className="text-xs text-muted mt-4">
              Сертификат срабатывает один раз: дату потом не поменять, поэтому проверь её перед отправкой. Прогноз по месяцам начнётся с текущего месяца. Разбор носит развлекательный и ознакомительный характер.
            </p>
          </div>
        </>
      ) : state === "redeemed" && order ? (
        <div className="card p-6 mt-6">
          <p className="display text-xl">Сертификат уже активирован</p>
          <p className="mt-2 text-muted">Разбор по этому сертификату готов и открывается по постоянной ссылке.</p>
          <p className="mt-4">
            <Link href={`/r/${order.id}`} className="btn">Открыть разбор</Link>
          </p>
        </div>
      ) : (
        <div className="card p-6 mt-6">
          <p className="display text-xl">{state === "unpaid" ? "Сертификат ещё не оплачен" : state === "closed" ? "Сертификат больше не действует" : "Ссылка не подходит"}</p>
          <p className="mt-2 text-muted">
            {state === "unpaid"
              ? "Как только оплата пройдёт, по этой ссылке можно будет ввести дату рождения. Обычно это занимает несколько минут."
              : state === "closed"
                ? "По этому заказу оформлен возврат или оплата не прошла."
                : "Проверь, что ссылка из письма скопирована целиком. Если не получается — ответь на письмо с сертификатом, мы поможем."}
          </p>
          <p className="mt-4">
            <Link href="/razbor" className="text-accent-text underline">Разбор по дате рождения — {RAZBOR.price} ₽</Link>
          </p>
        </div>
      )}

      <p className="text-sm text-muted mt-8">
        Пока можно посмотреть бесплатно: <Link href="/chislo-sudby" className="underline">число судьбы</Link>, <Link href="/kvadrat-pifagora" className="underline">квадрат Пифагора</Link> и <Link href="/numerologiya/lichnyy-god" className="underline">личный год</Link>.
      </p>
    </div>
  );
}
