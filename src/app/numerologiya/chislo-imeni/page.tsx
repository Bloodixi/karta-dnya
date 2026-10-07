import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import NumerologyNav from "@/components/NumerologyNav";
import { FormError, ShareLink, TextField } from "@/components/NumerologyFields";
import { getNameNumbers } from "@/lib/content";
import { cleanName, CYRILLIC_TABLE, isMaster, nameNumbers } from "@/lib/numerology";

const PATH = "/numerologiya/chislo-imeni";

export const metadata: Metadata = {
  title: "Число имени: рассчитать онлайн по таблице букв",
  description: "Калькулятор числа имени онлайн по кириллической таблице: число имени (выражения), число души по гласным и число личности по согласным. Значения чисел 1–9 и мастер-чисел 11, 22, 33.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Считать имя, фамилию и отчество или только имя?", a: "Классический расчёт делают по полному имени из документов. Но многие считают только имя, которым пользуются каждый день: оно описывает то, как вас воспринимают сейчас. Попробуйте оба варианта." },
  { q: "Буквы Ё и Е считаются одинаково?", a: "Нет. В нашей таблице Е относится к шестёрке, а Ё — к семёрке. Если в документах у вас Е вместо Ё, посчитайте оба написания." },
  { q: "Что такое число души и число личности?", a: "Число души считается только по гласным и описывает внутренние стремления. Число личности — по согласным и описывает внешний образ, то, как вас видят при первой встрече. Их сумма даёт число имени." },
  { q: "Что делать, если получилось 11, 22 или 33?", a: "Это мастер-числа, мы не сводим их дальше. Читайте и страницу мастер-числа, и страницу его основы: 2, 4 или 6." },
];

export default async function NameNumberPage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const name = cleanName(sp.n);
  const nm = name ? nameNumbers(name) : null;
  const invalid = sp.n !== undefined && !nm;
  const texts = getNameNumbers();
  const find = (n: number) => texts.find((t) => t.number === n);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Число имени" }]} />
      <h1 className="text-3xl md:text-4xl">Число имени: калькулятор по таблице букв</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Введите имя, и калькулятор переведёт каждую букву в цифру, сложит их и покажет три числа: имени, души и личности. Таблица и значения всех чисел ниже.</p>

      <div className="card p-6 mt-6 max-w-3xl">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <TextField name="n" label="Имя" defaultValue={name} placeholder="Например, Мария" required />
          <button type="submit" className="btn">Рассчитать</button>
        </Form>
        <FormError text={invalid ? "Введите имя буквами русского или латинского алфавита." : undefined} />
      </div>

      {nm && (
        <section className="mt-8" id="rezultat">
          <div className="ornament mb-4"><h2 className="text-2xl">Числа имени {nm.clean}</h2><span className="mono">{nm.letters.length} букв</span></div>
          <p className="flex flex-wrap gap-1 mb-4">{nm.letters.map((l, i) => <span key={i} className={`chip ${l.vowel ? "text-accent" : ""}`}>{l.ch} {l.value}</span>)}</p>
          <p className="text-xs text-muted mb-4">Гласные выделены цветом: они дают число души, согласные — число личности.</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5 md:col-span-3">
              <p className="mono">Число имени (выражения)</p>
              <p className="display text-5xl mt-1">{nm.expression.number} <span className="text-xl text-muted">· {find(nm.expression.number)?.title}</span></p>
              <p className="text-xs text-muted mt-1 break-words">{nm.expression.steps.join(" → ")}</p>
              <p className="text-sm mt-3 max-w-3xl">{find(nm.expression.number)?.text}</p>
              {isMaster(nm.expression.number) && <p className="text-sm mt-2 text-accent"><Link href="/numerologiya/master-chisla" className="underline">У вашего имени мастер-число</Link></p>}
            </div>
            <div className="card p-5">
              <p className="mono">Число души</p>
              <p className="display text-4xl mt-1">{nm.soul.number || "—"}</p>
              <p className="text-xs text-muted mt-1 break-words">{nm.soul.number ? nm.soul.steps.join(" → ") : "гласных нет"}</p>
              <p className="text-sm mt-3">{nm.soul.number ? find(nm.soul.number)?.soul : "В имени нет гласных букв."}</p>
            </div>
            <div className="card p-5">
              <p className="mono">Число личности</p>
              <p className="display text-4xl mt-1">{nm.personality.number || "—"}</p>
              <p className="text-xs text-muted mt-1 break-words">{nm.personality.number ? nm.personality.steps.join(" → ") : "согласных нет"}</p>
              <p className="text-sm mt-3">{nm.personality.number ? find(nm.personality.number)?.personality : "В имени нет согласных букв."}</p>
            </div>
            <div className="card p-5">
              <p className="mono">Сравнить с датой</p>
              <p className="text-sm mt-2">Число имени описывает подачу, число судьбы — вектор пути. Посчитайте оба в <Link href={`/numerologiya/po-date-rozhdeniya?n=${encodeURIComponent(nm.clean)}`} className="text-accent underline">сводном расчёте по дате и имени</Link>.</p>
            </div>
          </div>
          <ShareLink path={`https://karta-dnya.ru${PATH}?n=${encodeURIComponent(nm.clean)}`} />
        </section>
      )}

      <section className="mt-12">
        <div className="ornament mb-4"><h2 className="text-2xl">Таблица букв</h2><span className="mono">кириллица, по порядку алфавита</span></div>
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {Object.entries(CYRILLIC_TABLE).map(([d, letters]) => (
            <div key={d} className="card p-3 text-center">
              <p className="display text-2xl">{d}</p>
              <p className="text-sm text-muted tracking-widest">{letters.split("").join(" ")}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted mt-3">Гласные: А, Е, Ё, И, О, У, Ы, Э, Ю, Я. Ъ и Ь считаются согласными. Латинские буквы переводятся по пифагорейской таблице (A, J, S = 1; B, K, T = 2 и далее).</p>
      </section>

      <section className="prose mt-10">
        <h2>Как посчитать число имени вручную</h2>
        <ol>
          <li>Запишите имя и под каждой буквой поставьте цифру из таблицы. Например, МАРИЯ: М = 5, А = 1, Р = 9, И = 1, Я = 6.</li>
          <li>Сложите все цифры: 5 + 1 + 9 + 1 + 6 = 22. Это мастер-число, оно остаётся. Если сумма другая, например 24, складывайте дальше: 2 + 4 = 6.</li>
          <li>Отдельно сложите гласные (число души) и согласные (число личности). У Марии гласные А, И, Я = 1 + 1 + 6 = 8, согласные М, Р = 5 + 9 = 14 → 5.</li>
        </ol>
        <p>Число имени показывает, как человек проявляется и каким его видят. Оно дополняет <Link href="/chislo-sudby">число судьбы</Link>, которое считают по дате рождения. Если числа совпадают, внутреннее и внешнее звучат в унисон; если различаются, это повод подумать, где вы «играете роль», а где остаётесь собой. Подробный разбор с примерами есть в статье <Link href="/numerologiya/chislo-imeni-numerologiya">о числе имени</Link>.</p>
      </section>

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Значения чисел имени</h2><span className="mono">1–9 и мастер-числа</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {texts.map((t) => (
            <div key={t.number} className="card p-5">
              <p className="display text-3xl">{t.number} <span className="text-lg text-muted">· {t.title}</span></p>
              <p className="text-sm text-muted mt-2">{t.text}</p>
              <p className="text-xs mt-3"><span className="mono">душа</span> {t.soul}</p>
              <p className="text-xs mt-1"><span className="mono">личность</span> {t.personality}</p>
            </div>
          ))}
        </div>
      </section>

      <Faq items={FAQ} />
      <NumerologyNav current={PATH} />
    </div>
  );
}
