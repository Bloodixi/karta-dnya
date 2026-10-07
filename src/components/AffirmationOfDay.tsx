import Link from "next/link";
import { AFFIRM_PATH, affirmationOfDay } from "@/lib/affirmations";
import { formatDateRu, todayKey } from "@/lib/daily";

/** Крупная цитата «аффирмация дня»; серверный компонент, без JS на клиенте. */
export default function AffirmationOfDay({ link = true }: { link?: boolean }) {
  const date = todayKey();
  return (
    <figure className="card p-6 md:p-10 text-center">
      <p className="chip">Аффирмация дня · {formatDateRu(date, { day: "numeric", month: "long" })}</p>
      <blockquote className="font-display text-2xl md:text-4xl leading-snug mt-5 max-w-3xl mx-auto">«{affirmationOfDay(date)}»</blockquote>
      {link && (
        <figcaption className="mt-5 text-sm">
          <Link href={`${AFFIRM_PATH}/dnya`} className="text-accent underline">Подробнее об аффирмации дня →</Link>
        </figcaption>
      )}
    </figure>
  );
}
