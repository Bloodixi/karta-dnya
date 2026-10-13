import { SELLER, SELLER_DRAFT } from "@/lib/site";

/** Плашка, пока владелец не заполнил SELLER в src/lib/site.ts. После заполнения исчезает сама. */
export function SellerDraftNotice() {
  if (!SELLER_DRAFT) return null;
  return (
    <p role="note" className="card p-4 mb-6 border-l-4 !border-l-accent font-semibold">
      Реквизиты уточняются. Документ будет дополнен данными продавца в ближайшее время.
    </p>
  );
}

/** Блок реквизитов продавца. */
export function SellerDetails() {
  return (
    <ul>
      <li>Продавец (исполнитель): {SELLER.name}</li>
      <li>Статус: {SELLER.status}</li>
      <li>ИНН: {SELLER.inn}</li>
      <li>
        E-mail для обращений: {SELLER.email.includes("@") ? <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a> : SELLER.email}
      </li>
    </ul>
  );
}
