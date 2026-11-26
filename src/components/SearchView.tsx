import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2, Search as SearchIcon } from 'lucide-react';
import { searchQuran, type SearchMatch, type SurahMeta } from '../lib/api';
import { useStore } from '../lib/store';
import { ErrorBox, SectionTitle } from './ui';

interface Props {
  surahs: SurahMeta[];
  onOpenSurah: (surah: number, ayah?: number) => void;
}

type Edition = 'quran-uthmani' | 'en.sahih' | 'bn.bengali';

export default function SearchView({ surahs, onOpenSurah }: Props) {
  const { t } = useStore();
  const [query, setQuery] = useState('');
  const [edition, setEdition] = useState<Edition>('en.sahih');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);

  // "2:255" style direct reference
  const directRef = useMemo(() => {
    const m = query.trim().match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
    if (!m) return null;
    const s = Number(m[1]);
    const a = Number(m[2]);
    const meta = surahs.find((x) => x.number === s);
    if (!meta || a < 1 || a > meta.numberOfAyahs) return null;
    return { surah: s, ayah: a, name: meta.englishName };
  }, [query, surahs]);

  // Client-side surah name / number matches
  const surahMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(query.trim()) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        String(s.number) === q,
    ).slice(0, 8);
  }, [query, surahs]);

  const runSearch = (q: string, ed: Edition) => {
    const keyword = q.trim();
    if (keyword.length < 2 || directRef) {
      setResults([]);
      setCount(0);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    searchQuran(keyword, ed)
      .then((data) => {
        setResults(data.matches ?? []);
        setCount(data.count ?? 0);
        setSearched(true);
      })
      .catch(() => {
        setError(t('errorLoading'));
        setSearched(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(query, edition), 600);
    return () => window.clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, edition]);

  const shown = results.slice(0, 50);

  return (
    <div className="animate-fade-up">
      <SectionTitle title={t('search')} subtitle={t('searchHint')} />

      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-full border border-black/10 bg-cream py-3 pl-12 pr-4 text-base outline-none transition focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/20 dark:border-white/15 dark:bg-white/5"
            aria-label={t('searchPlaceholder')}
            autoFocus
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink-soft dark:text-white/60">{t('searchIn')}:</span>
          {(
            [
              { id: 'quran-uthmani', label: t('arabic') },
              { id: 'en.sahih', label: t('english') },
              { id: 'bn.bengali', label: t('bangla') },
            ] as const
          ).map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEdition(e.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                edition === e.id ? 'bg-emerald-brand text-white' : 'bg-black/5 text-ink hover:bg-emerald-soft dark:bg-white/10 dark:text-white'
              }`}
            >
              {e.label}
            </button>
          ))}
          {loading && (
            <span className="ml-auto inline-flex items-center gap-1 text-sm text-ink-soft dark:text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {t('loading')}
            </span>
          )}
        </div>
      </div>

      {/* Direct reference 2:255 */}
      {directRef && (
        <button
          type="button"
          onClick={() => onOpenSurah(directRef.surah, directRef.ayah)}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-emerald-brand/40 bg-emerald-soft p-4 text-left transition hover:shadow-md dark:bg-emerald-950/60"
        >
          <span>
            <span className="block text-sm font-semibold text-emerald-brand dark:text-emerald-300">
              {directRef.name} · {t('surah')} {directRef.surah} : {t('ayah')} {directRef.ayah}
            </span>
            <span className="block text-xs text-ink-soft dark:text-white/60">{t('read')} →</span>
          </span>
          <ArrowRight className="h-5 w-5 text-emerald-brand" aria-hidden="true" />
        </button>
      )}

      {/* Surah matches */}
      {surahMatches.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft dark:text-white/55">{t('surahs')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {surahMatches.map((s) => (
              <button
                key={s.number}
                type="button"
                onClick={() => onOpenSurah(s.number)}
                className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:border-emerald-brand/40 dark:border-white/10 dark:bg-white/5"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-soft text-sm font-bold text-emerald-brand dark:bg-emerald-950 dark:text-emerald-300">
                    {s.number}
                  </span>
                  <span>
                    <span className="block font-semibold text-ink dark:text-white">{s.englishName}</span>
                    <span className="block text-xs text-ink-soft dark:text-white/55">
                      {s.englishNameTranslation} · {s.numberOfAyahs} {t('ayahs')}
                    </span>
                  </span>
                </span>
                <span className="arabic-name text-xl text-emerald-deep dark:text-emerald-200">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text results */}
      {searched && !loading && !directRef && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft dark:text-white/55">
            {count.toLocaleString()} {t('results')}
            {count > 50 ? ` — ${t('results')} 1–50` : ''}
          </h3>
          {error && <ErrorBox message={error} onRetry={() => runSearch(query, edition)} />}
          {!error && results.length === 0 && (
            <p className="rounded-2xl border border-black/5 bg-white p-6 text-center text-sm text-ink-soft dark:border-white/10 dark:bg-white/5 dark:text-white/60">
              {t('noResults')}
            </p>
          )}
          <div className="space-y-3">
            {shown.map((m) => (
              <button
                key={`${m.surah.number}-${m.numberInSurah}`}
                type="button"
                onClick={() => onOpenSurah(m.surah.number, m.numberInSurah)}
                className="block w-full rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:border-emerald-brand/40 hover:shadow-md dark:border-white/10 dark:bg-white/5"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-emerald-brand dark:text-emerald-300">
                    {m.surah.englishName} · {t('surah')} {m.surah.number} : {t('ayah')} {m.numberInSurah}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-brand" aria-hidden="true" />
                </span>
                <span
                  className={`mt-2 block leading-relaxed text-ink dark:text-white ${
                    edition === 'quran-uthmani' ? 'quran-text text-right text-xl' : 'text-sm'
                  }`}
                  lang={edition === 'quran-uthmani' ? 'ar' : undefined}
                >
                  {m.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
