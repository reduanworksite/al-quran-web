/**
 * AlQuran Cloud API client — https://api.alquran.cloud/v1
 * Free, no API key required. All Quran text and translations come from
 * this API only. Nothing is invented here.
 *
 * Translators:
 *  - Bangla (bn.bengali): Muhiuddin Khan
 *  - Bangla (bn.hoque): Zohurul Hoque
 *  - English (en.sahih): Saheeh International
 */

const BASE = 'https://api.alquran.cloud/v1';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface SurahMeta {
  number: number;
  name: string; // Arabic name
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number; // global ayah number (1..6236)
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | Record<string, unknown>;
  audio?: string;
  surah?: { number: number; name: string; englishName: string; englishNameTranslation: string; revelationType: string; numberOfAyahs: number };
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
  edition: { identifier: string; language: string; name: string; englishName: string; format: string; type: string };
}

export interface SearchMatch {
  number: number;
  text: string;
  edition: { identifier: string };
  surah: { number: number; name: string; englishName: string; englishNameTranslation: string; revelationType: string; numberOfAyahs: number };
  numberInSurah: number;
}

export interface Reciter {
  id: string;
  name: string;
  style: string;
}

export const RECITERS: Reciter[] = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', style: 'Murattal' },
  { id: 'ar.abdulbasitmurattal', name: 'AbdulBasit AbdusSamad', style: 'Murattal' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', style: 'Murattal' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi', style: 'Murattal' },
  { id: 'ar.minshawimujawwad', name: 'Mohamed Siddiq El-Minshawi', style: 'Mujawwad' },
  { id: 'ar.mahermuaiqly', name: 'Maher Al Muaiqly', style: 'Murattal' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdur-Rahman as-Sudais', style: 'Murattal' },
  { id: 'ar.saoodshuraym', name: 'Saud Ash-Shuraim', style: 'Murattal' },
  { id: 'ar.hanirifai', name: 'Hani ar-Rifai', style: 'Murattal' },
  { id: 'ar.shaatree', name: 'Abu Bakr al-Shatri', style: 'Murattal' },
];

export const BN_TRANSLATIONS = [
  { id: 'bn.bengali', name: 'Muhiuddin Khan', label: 'Muhiuddin Khan' },
  { id: 'bn.hoque', name: 'Zohurul Hoque', label: 'Zohurul Hoque' },
];

export const TOTAL_SURAHS = 114;
export const TOTAL_AYAHS = 6236;

/* ------------------------------------------------------------------ */
/* Bismillah handling — VERIFIED against live API responses            */
/*                                                                     */
/* Surah 1: ayah 1 IS the Bismillah (numbered) — render normally.      */
/* Surahs 2-114 (except 9): the API prepends the Bismillah to ayah   */
/* 1's Arabic text. Strip that exact prefix and render it as a        */
/* separate, unnumbered, centered header. Surah 9 has no Bismillah.   */
/* Translations (bn.bengali / en.sahih) do NOT include a Bismillah    */
/* translation in ayah 1, so stripping applies to Arabic only.        */
/* ------------------------------------------------------------------ */

// Exact Uthmani Bismillah prefix as returned by the API (with trailing
// space), written as unicode escapes so no codepoint is ever mistyped.
const BISMILLAH_PREFIX = '\u0628\u0650\u0633\u06e1\u0645\u0650\u0020\u0671\u0644\u0644\u0651\u064e\u0647\u0650\u0020\u0671\u0644\u0631\u0651\u064e\u062d\u06e1\u0645\u064e\u0640\u0670\u0646\u0650\u0020\u0671\u0644\u0631\u0651\u064e\u062d\u0650\u06cc\u0645\u0650\u0020';

export function hasBismillahHeader(surahNumber: number): boolean {
  return surahNumber !== 1 && surahNumber !== 9;
}

/** The Bismillah itself, exactly as the API returns it (Uthmani text). */
export const BISMILLAH_TEXT = BISMILLAH_PREFIX.trim();

/** Remove the prepended Bismillah from ayah 1 Arabic text, if present. */
export function stripBismillah(text: string): string {
  if (text.startsWith(BISMILLAH_PREFIX)) {
    return text.slice(BISMILLAH_PREFIX.length).trim();
  }
  return text;
}

/** Clean a raw Arabic ayah text (trailing newline, etc.). */
export function cleanArabic(text: string): string {
  return text.trim();
}

/* ------------------------------------------------------------------ */
/* Fetch helpers with in-memory cache                                  */
/* ------------------------------------------------------------------ */

const memoryCache = new Map<string, unknown>();

async function fetchJSON<T>(url: string, cacheKey?: string): Promise<T> {
  if (cacheKey && memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) as T;
  }
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('NETWORK_ERROR');
  }
  if (!res.ok) {
    throw new Error(`API_ERROR_${res.status}`);
  }
  const json = (await res.json()) as { code: number; status: string; data: T };
  if (json.code !== 200) {
    throw new Error(`API_ERROR_${json.code}`);
  }
  if (cacheKey) memoryCache.set(cacheKey, json.data);
  return json.data;
}

export async function getSurahList(): Promise<SurahMeta[]> {
  const cached = localStorage.getItem('aq_surah_list_v1');
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as SurahMeta[];
      if (Array.isArray(parsed) && parsed.length === 114) return parsed;
    } catch {
      /* fall through to network */
    }
  }
  const data = await fetchJSON<SurahMeta[]>(`${BASE}/surah`);
  localStorage.setItem('aq_surah_list_v1', JSON.stringify(data));
  return data;
}

export async function getSurah(surahNumber: number, edition = 'quran-uthmani'): Promise<SurahData> {
  return fetchJSON<SurahData>(
    `${BASE}/surah/${surahNumber}/${edition}`,
    `surah-${surahNumber}-${edition}`,
  );
}

export async function getJuz(juzNumber: number, edition = 'quran-uthmani'): Promise<SurahData> {
  // The Juz endpoint returns { number, ayahs: [...] } with per-ayah surah info.
  return fetchJSON<SurahData>(
    `${BASE}/juz/${juzNumber}/${edition}`,
    `juz-${juzNumber}-${edition}`,
  );
}

export async function searchQuran(
  keyword: string,
  edition: 'quran-uthmani' | 'en.sahih' | 'bn.bengali',
): Promise<{ count: number; matches: SearchMatch[] }> {
  const data = await fetchJSON<{ count: number; matches: SearchMatch[] }>(
    `${BASE}/search/${encodeURIComponent(keyword)}/all/${edition}`,
  );
  return data;
}

/** Map a global ayah number (1..6236) to { surah, ayah } using the surah list. */
export function globalAyahToSurah(surahs: SurahMeta[], globalNumber: number): { surah: number; ayah: number } {
  let remaining = globalNumber;
  for (const s of surahs) {
    if (remaining <= s.numberOfAyahs) {
      return { surah: s.number, ayah: remaining };
    }
    remaining -= s.numberOfAyahs;
  }
  return { surah: 114, ayah: 6 };
}

/** Deterministic "ayah of the day": hash the date into 1..6236. */
export function todaysAyahNumber(date = new Date()): number {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  // Simple stable hash so the same date always gives the same ayah.
  let h = seed;
  h = (h ^ 61) ^ (h >>> 16);
  h = (h + (h << 3)) >>> 0;
  h = h ^ (h >>> 4);
  h = Math.imul(h, 0x27d4eb2d) >>> 0;
  h = h ^ (h >>> 15);
  return (h % TOTAL_AYAHS) + 1;
}

/** Deterministic "featured surah of the day" (1..114). */
export function featuredSurahNumber(date = new Date()): number {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return (dayOfYear % TOTAL_SURAHS) + 1;
}
