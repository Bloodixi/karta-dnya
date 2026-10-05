import Link from "next/link";
import { SECTIONS, SECTION_KEYS, SITE, TOOLS } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-sunk">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <p className="display text-lg font-semibold">
            <span className="text-gold">✦</span> {SITE.name}
          </p>
          <p className="text-muted mt-2 max-w-sm">{SITE.tagline}.</p>
          <p className="text-muted mt-3 text-xs">
            Материалы сайта носят развлекательный и познавательный характер и не заменяют консультацию специалистов.
          </p>
          <p className="text-muted mt-2 text-xs">Иллюстрации карт: колода Райдера–Уэйта (Памела Колман Смит, 1909), общественное достояние.</p>
        </div>
        <div>
          <p className="font-semibold mb-2">Разделы</p>
          <ul className="grid gap-1 text-muted">
            {SECTION_KEYS.map((k) => (
              <li key={k}>
                <Link href={`/${k}`} className="hover:text-ink">
                  {SECTIONS[k].title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">Инструменты</p>
          <ul className="grid gap-1 text-muted">
            {TOOLS.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="hover:text-ink">
                  {t.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/taro/karty" className="hover:text-ink">
                Значения карт Таро
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">
          © {new Date().getFullYear()} {SITE.name}. Все материалы защищены.
        </p>
      </div>
    </footer>
  );
}
