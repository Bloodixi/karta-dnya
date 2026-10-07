import { readJsonData, type Faq } from "./content";
import { hash, shiftKey, todayKey } from "./daily";

export type AffirmationTopic = {
  slug: string;
  name: string;
  h1: string;
  short: string;
  title: string;
  description: string;
  intro: string[];
  items: string[];
  how: string[];
  faq: { q: string; a: string }[];
};

type AffirmationData = { topics: AffirmationTopic[]; day: string[] };

const getData = () => readJsonData<AffirmationData>("affirmations.json", { topics: [], day: [] });

export const AFFIRM_PATH = "/praktiki/affirmacii";
export const getAffirmationTopics = () => getData().topics;
export const findAffirmationTopic = (slug: string) => getData().topics.find((t) => t.slug === slug) || null;

export type { Faq };

/** Аффирмация дня: от даты по Москве, одна для всех посетителей. Пул перемешан хэшем, подряд идущие дни не повторяются. */
export function affirmationOfDay(dateKey = todayKey()): string {
  const pool = getData().day;
  if (!pool.length) return "";
  const prev = pool[hash("affirm:" + shiftKey(dateKey, -1)) % pool.length];
  const cur = pool[hash("affirm:" + dateKey) % pool.length];
  return cur === prev ? pool[(pool.indexOf(cur) + 1) % pool.length] : cur;
}
