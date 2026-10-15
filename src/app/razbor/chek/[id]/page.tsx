import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/RazborClient";
import { getOrder } from "@/lib/razborStore";
import { qrSvg, receiptView } from "@/lib/receiptView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Чек об оплате",
  description: "Чек самозанятого «Мой налог» об оплате разбора на сайте «Карта дня». Страница доступна только по ссылке из письма.",
  robots: { index: false, follow: false },
};

/** Чек по номеру заказа (случайный, известен только покупателю). Реквизиты по 422-ФЗ, ст. 14; QR — официальный чек ФНС. */
export default async function ReceiptPage({ params }: PageProps<"/razbor/chek/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  const r = order && order.status === "paid" ? receiptView(order) : null;
  if (!r) notFound();
  const qr = await qrSvg(r.fnsUrl);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card frame-gold px-7 py-8">
        <p className="text-xs uppercase tracking-widest text-muted">Кассовый чек · приход</p>
        <h1 className="mt-1 text-2xl font-semibold">Чек № {r.number}</h1>
        <p className="mt-1 text-sm text-muted">
          {r.date} · {r.time} (МСК)
        </p>

        <dl className="mt-6 grid gap-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Продавец</dt>
            <dd className="text-right">{r.seller}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">ИНН</dt>
            <dd className="text-right tabular-nums">{r.inn}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Режим НО</dt>
            <dd className="text-right">НПД (налог на профессиональный доход)</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-dashed border-line pt-4 text-sm">
          <div className="flex justify-between gap-4 text-muted">
            <span>Наименование</span>
            <span>Сумма</span>
          </div>
          <div className="mt-2 flex justify-between gap-4">
            <span>1. {r.item}</span>
            <span className="tabular-nums whitespace-nowrap">{r.amount}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-between border-t border-dashed border-line pt-4 text-lg font-semibold">
          <span>Итого</span>
          <span className="tabular-nums">{r.amount}</span>
        </div>
        <p className="mt-1 text-sm text-muted">Безналичный расчёт</p>

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-dashed border-line pt-6">
          <div className="w-36 h-36 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <a href={r.fnsUrl} target="_blank" rel="noopener" className="text-sm text-muted underline">
            Проверить чек на сайте ФНС
          </a>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2 no-print">
        <PrintButton />
        <Link href="/razbor" className="btn btn-ghost">
          О разборе
        </Link>
      </div>
    </div>
  );
}
