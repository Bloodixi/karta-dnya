import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SellerDetails, SellerDraftNotice } from "@/components/SellerNotice";
import { RAZBOR } from "@/lib/razbor";
import { SELLER } from "@/lib/site";

const PATH = "/vozvrat";

export const metadata: Metadata = {
  title: "Возврат оплаты",
  description: "Как вернуть оплату за нумерологический разбор на сайте «Карта дня»: когда возможен возврат, что указать в письме, сроки ответа и способ возврата денег.",
  alternates: { canonical: PATH },
};

export default function RefundPage() {
  const email = SELLER.email.includes("@") ? SELLER.email : null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: PATH, label: "Возврат" }]} />
      <h1 className="text-3xl md:text-4xl">Возврат оплаты</h1>
      <p className="text-muted mt-2 max-w-2xl">Условия возврата за «{RAZBOR.title}». Полные условия покупки — в <Link href="/oferta" className="text-accent underline">публичной оферте</Link>.</p>

      <div className="prose mt-8">
        <SellerDraftNotice />

        <h2>Когда мы возвращаем деньги</h2>
        <p>Разбор — цифровой материал, который открывается сразу после оплаты. Если из-за технической ошибки разбор не был предоставлен — страница не открылась, ссылка не пришла, оплата прошла дважды, — мы вернём уплаченную сумму полностью.</p>
        <p>Если что-то в разборе отображается неправильно, напиши нам: сначала постараемся исправить, а если не получится — вернём оплату.</p>

        <h2>Как оформить возврат</h2>
        <ol>
          <li>Напиши на {email ? <a href={`mailto:${email}?subject=${encodeURIComponent("Возврат за разбор")}`}>{email}</a> : "e-mail продавца (указан ниже)"}.</li>
          <li>Укажи номер заказа (он есть на странице оплаты и в адресе после слова «spasibo?o=»), дату и сумму платежа. Можно приложить чек.</li>
          <li>Коротко опиши, что произошло.</li>
        </ol>

        <h2>Сроки</h2>
        <p>Отвечаем в течение 3 рабочих дней. Деньги возвращаются тем же способом, которым была произведена оплата, через платёжный сервис ЮKassa. Срок зачисления на карту зависит от банка и обычно занимает от нескольких дней до двух недель.</p>

        <h2>Продавец</h2>
        <SellerDetails />
      </div>
    </div>
  );
}
