import fs from "node:fs";
import path from "node:path";
import type { HoroscopeText } from "./astro/types";

/**
 * Подробный гороскоп на год вперёд (страницы /goroskop/<год> и /goroskop/<знак>/<год>).
 * Тексты лежат там же, где годовые тексты вкладки «Год»: content/data/horoscopes/god/<год>-01-01.json —
 * поэтому 1 января вкладка «Год» сама покажет их, а ночной конвейер не пересчитает файл, который уже есть.
 * Поверх обычных полей у каждого знака: сезоны, благоприятные месяцы, хвост заголовка и описание страницы.
 * Обзор года для хаба — рядом, в <год>-01-01.overview.json.
 */
export const FORECAST_YEAR = 2027;

export type YearSign = HoroscopeText & {
  titleTail: string;
  description: string;
  lead: string;
  seasons: { label: string; text: string }[];
  goodMonths: { month: string; text: string }[];
};

export type YearOverview = {
  year: number;
  lead: string;
  sections: { h: string; p: string[] }[];
  keyDates: { date: string; text: string }[];
  eastern: string;
  numerology: string;
};

const DIR = path.join(process.cwd(), "content", "data", "horoscopes", "god");

function read<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8")) as T;
  } catch {
    return null;
  }
}

export function yearSigns(year = FORECAST_YEAR): YearSign[] {
  const arr = read<YearSign[]>(`${year}-01-01.json`);
  return Array.isArray(arr) ? arr.filter((t) => t && Array.isArray(t.seasons)) : [];
}

export function yearSign(sign: string, year = FORECAST_YEAR): YearSign | undefined {
  return yearSigns(year).find((t) => t.sign === sign);
}

export function yearOverview(year = FORECAST_YEAR): YearOverview | null {
  return read<YearOverview>(`${year}-01-01.overview.json`);
}
