import Image from "next/image";
import Link from "next/link";
import { horoscopeAuthor } from "@/lib/authors";
import { SECTIONS, SECTION_KEYS, SITE, SOCIAL, TOOLS } from "@/lib/site";

export default function Footer() {
  const author = horoscopeAuthor();
  return (
    // Ночной подвал — зеркало ночной шапки главной: графит с линовкой, сверху «зубчатый» край.
    // На .night свои цвета: text-muted перекрашивается в night-muted, а hover — в night-ink (обычный text-ink на графите не виден в светлой теме).
    <footer className="night mt-16">
      <div aria-hidden="true" className="night-edge" style={{ position: "absolute", top: 0, left: 0, right: 0, marginTop: 0, transform: "rotate(180deg)" }} />
      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <p className="display text-lg inline-flex items-center gap-2">
            <Image src="/logo-56.webp" alt="" width={24} height={24} className="rounded" /> {SITE.name}
          </p>
          <p className="text-muted mt-2 max-w-sm">{SITE.tagline}.</p>
          <p className="mono mt-5 !text-[var(--gold)]">Мы в соцсетях</p>
          <ul className="mt-1 flex flex-wrap gap-x-5">
            {[SOCIAL.telegram, SOCIAL.vk, SOCIAL.youtube, SOCIAL.dzen].map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="me noopener" className="inline-block py-2 underline decoration-[var(--night-line)] underline-offset-4 hover:decoration-[var(--accent-soft)]">{s.title}</a>
              </li>
            ))}
          </ul>
          <p className="mt-1 flex flex-wrap gap-x-5">
            <Link href="/o-proekte" className="inline-block py-2 underline decoration-[var(--night-line)] underline-offset-4 hover:decoration-[var(--accent-soft)]">О проекте</Link>
            <Link href="/astrologiya/kak-my-schitaem" className="inline-block py-2 underline decoration-[var(--night-line)] underline-offset-4 hover:decoration-[var(--accent-soft)]">Как мы считаем</Link>
          </p>
          <p className="text-muted mt-3 text-xs">
            Материалы сайта носят развлекательный и познавательный характер и не заменяют консультацию специалистов.
          </p>
          <p className="text-muted mt-2 text-xs">Иллюстрации карт: колода Райдера–Уэйта (Памела Колман Смит, 1909), общественное достояние. Фото камней — Wikimedia Commons, авторы и лицензии указаны под каждым фото.</p>
          {author && (
            <p className="text-muted mt-2 text-xs">
              Гороскопы — <Link href={`/avtory/${author.slug}`} className="hover:text-[var(--night-ink)] underline">{author.name}</Link>, {author.role}. <Link href="/astrologiya/kak-my-schitaem" className="hover:text-[var(--night-ink)] underline">Как мы считаем</Link>.
            </p>
          )}
        </div>
        <div>
          <p className="mono mb-3 !text-[var(--gold)]">Разделы</p>
          <ul className="grid grid-cols-2 gap-x-4 md:grid-cols-1 text-muted">
            {SECTION_KEYS.map((k) => (
              <li key={k}>
                <Link href={`/${k}`} className="block py-2 md:py-0.5 hover:text-[var(--night-ink)]">
                  {SECTIONS[k].title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono mb-3 !text-[var(--gold)]">Инструменты</p>
          <ul className="grid grid-cols-2 gap-x-4 md:grid-cols-1 text-muted">
            {TOOLS.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="block py-2 md:py-0.5 hover:text-[var(--night-ink)]">
                  {t.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/taro/karty" className="block py-2 md:py-0.5 hover:text-[var(--night-ink)]">
                Значения карт Таро
              </Link>
            </li>
            <li>
              <Link href="/razbor" className="block py-2 md:py-0.5 hover:text-[var(--night-ink)]">
                Разбор по дате рождения
              </Link>
            </li>
            <li>
              <Link href="/sovmestimost-razbor" className="block py-2 md:py-0.5 hover:text-[var(--night-ink)]">
                Совместимость пары
              </Link>
            </li>
            <li>
              <Link href="/razbor-rebenka" className="block py-2 md:py-0.5 hover:text-[var(--night-ink)]">
                Детский разбор
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-[var(--night-line)]">
        {/* flex-wrap: каждая ссылка переносится целиком, строка не выходит за край на узком экране */}
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* На телефоне копирайт — отдельной строкой, чтобы точка-разделитель не повисала в конце */}
          <span className="basis-full sm:basis-auto">© {new Date().getFullYear()} {SITE.name}. Все материалы защищены.</span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <Link href="/oferta" className="inline-block py-2 sm:py-0 hover:text-[var(--night-ink)] underline">Оферта</Link>
          <span aria-hidden="true">·</span>
          <Link href="/vozvrat" className="inline-block py-2 sm:py-0 hover:text-[var(--night-ink)] underline">Возврат</Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy" className="inline-block py-2 sm:py-0 hover:text-[var(--night-ink)] underline">Конфиденциальность</Link>
        </p>
      </div>
    </footer>
  );
}
