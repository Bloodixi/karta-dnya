import Link from "next/link";
import CardBack from "@/components/CardBack";
import { IconBadge } from "@/components/Icons";
import { SECTIONS, SECTION_KEYS } from "@/lib/site";

export default function NotFound() {
  return (
    <div>
      <section className="night">
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 md:pt-16 md:pb-20 grid gap-8 md:grid-cols-[1fr_auto] items-center text-center md:text-left">
          <div>
            <p className="mono mb-4">ошибка 404</p>
            <h1 className="text-3xl md:text-5xl leading-[1.1]">Такой страницы нет</h1>
            <p className="text-muted mt-4 max-w-xl mx-auto md:mx-0 text-lg">Карты молчат. Попробуйте начать с главной или вытянуть карту дня.</p>
            <div className="mt-7 flex flex-wrap justify-center md:justify-start gap-3">
              <Link href="/" className="btn">На главную</Link>
              <Link href="/karta-dnya" className="btn btn-ghost">Карта дня</Link>
            </div>
          </div>
          <div className="w-24 md:w-32 justify-self-center row-start-1 md:row-start-auto" aria-hidden="true">
            <CardBack className="block w-full h-auto rounded-[4px]" />
          </div>
        </div>
      </section>
      <div className="night-edge" />

      <nav aria-label="Разделы сайта" className="mx-auto max-w-6xl px-4 pt-10 pb-4">
        <h2 className="text-2xl mb-4">Разделы</h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SECTION_KEYS.map((k) => (
            <li key={k}>
              <Link href={`/${k}`} className="card card-hover p-3 sm:p-4 flex items-center gap-3 h-full">
                <IconBadge name={SECTIONS[k].icon} className="shrink-0" />
                <span className="display text-lg">{SECTIONS[k].title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
