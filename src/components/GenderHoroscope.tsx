import { readJsonData } from "@/lib/content";
import { hash, type Horoscope } from "@/lib/daily";
import { GENDER_INFO, SPHERE_LABEL, type Gender, type Sphere } from "@/lib/genderHoroscope";

type Bank = {
  woman: Record<Sphere, { up: string[]; calm: string[] }>;
  man: Record<Sphere, { up: string[]; calm: string[] }>;
  signs: Record<string, Record<Gender, string>>;
};

type Block = { gender: Gender; note: string; items: { label: string; text: string }[] };

/** Детерминированно от знака, периода и даты; тон сферы — по оценке основного гороскопа
 *  (4–5 — «up», иначе «calm»), чтобы блоки не спорили с прогнозом выше. */
function genderBlocks(h: Horoscope): Block[] {
  const bank = readJsonData<Bank | null>("horoscope-gender.json", null);
  if (!bank) return [];
  const score: Record<Sphere, number> = { love: h.score.love, work: h.score.career, self: h.score.energy };
  // Списки для женщины и мужчины параллельны по смыслу (i-я фраза ≈ i-я фраза), поэтому мужчине берём
  // другой номер, чем женщине, — блоки описывают разные ситуации, а не одну и ту же в двух формулировках.
  const seed = (sp: Sphere) => hash(`${h.sign.slug}:${h.period}:${h.key}:${sp}`);
  return (["woman", "man"] as Gender[]).flatMap((g) => {
    const items = (["love", "work", "self"] as Sphere[]).map((sp) => {
      const pool = bank[g]?.[sp]?.[score[sp] >= 4 ? "up" : "calm"] || [];
      const n = pool.length;
      const i = g === "woman" || n < 2 ? seed(sp) % (n || 1) : (seed(sp) % n + 1 + ((seed(sp) >>> 8) % (n - 1))) % n;
      return { label: SPHERE_LABEL[sp], text: n ? pool[i] : "" };
    });
    return items.every((i) => i.text) ? [{ gender: g, note: bank.signs?.[h.sign.slug]?.[g] || "", items }] : [];
  });
}

/** Блоки «Для женщины» и «Для мужчины» под основным гороскопом знака (якоря #zhenshchina / #muzhchina). */
export default function GenderHoroscope({ h }: { h: Horoscope }) {
  const blocks = genderBlocks(h);
  if (!blocks.length) return null;
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {blocks.map((b) => (
        <section key={b.gender} id={GENDER_INFO[b.gender].anchor} className="card p-5 scroll-mt-24">
          <h2 className="text-xl">{GENDER_INFO[b.gender].title}</h2>
          {b.note && <p className="mt-2 text-sm">{b.note}</p>}
          <dl className="mt-3 grid gap-2 text-sm">
            {b.items.map((i) => (
              <div key={i.label}>
                <dt className="font-semibold">{i.label}</dt>
                <dd className="text-muted">{i.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
