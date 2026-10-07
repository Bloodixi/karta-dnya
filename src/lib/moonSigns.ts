import { readJsonData } from "./content";
import type { SignSlug } from "./astro/types";

export type MoonSign = { slug: SignSlug; title: string; meaning: string; good: string[]; avoid: string[]; tip: string };

export const getMoonSigns = () => readJsonData<MoonSign[]>("astro/moon-signs.json", []);
export const findMoonSign = (slug: string): MoonSign | null => getMoonSigns().find((m) => m.slug === slug) || null;
