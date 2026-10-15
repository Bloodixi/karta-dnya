import MetrikaCounter from "./MetrikaCounter";

/**
 * Яндекс.Метрика: включается переменной окружения METRIKA_ID (номер счётчика). Без неё ничего не рендерится.
 * На личных страницах разбора (/r/*, /razbor/r/*, /razbor/chek/*, /razbor/spasibo) счётчик не загружается — см. MetrikaCounter.
 */
export default function Metrika() {
  const id = process.env.METRIKA_ID;
  if (!id || !/^\d+$/.test(id)) return null;
  return <MetrikaCounter id={Number(id)} />;
}
