import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, ListOrdered, Search } from 'lucide-react';
import { getJuz, type SurahData, type SurahMeta } from '../lib/api';
import { useStore } from '../lib/store';
import { ErrorBox, ReaderSkeleton, SectionTitle, SurahCard } from './ui';

interface Props {
  surahs: SurahMeta[];
  onOpenSurah: (surah: number, ayah?: number) => void;
}

type Tab = 'surahs' | 'juz';

export default function SurahList({ surahs, onOpenSurah }: Props) {
  const { t, readAyahs } = useStore();
  const [tab, setTab] = useState<Tab>('surahs');
  const [filter, setFilter] = useState('');
  const [revelationFilter, setRevelationFilter] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [openJuz, setOpenJuz] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return surahs.filter((s) => {
      if (revelationFilter !== 'all' && s.revelationType !== revelationFilter) return false;
      if (!q) return true;
      return (
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(filter.trim()) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        String(s.number) === q
      );
    });
  }, [surahs, filter, revelationFilter]);

  const progressOf = (s: SurahMeta) => {
    let read = 0;
    for (let a = 1; a <= s.numberOfAyahs; a++) if (readAyahs.has(`${s.number}:${a}`)) read++;
    return read / s.numberOfAyahs;
  };

  return (
    <div className="animate-fade-up">
      <SectionTitle title={t('surahs')} subtitle={`${surahs.length} ${t('surahs')} · 6236 ${t('ayahs')}`} />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Navigation">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'surahs'}
          onClick={() => setTab('surahs')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === 'surahs' ? 'bg-emerald-brand text-white' : 'bg-white text-ink border border-black/10 dark:bg-white/5 dark:text-white dark:border-white/15'
          }`}
        >
          <ListOrdered className="h-4 w-4" aria-hidden="true" /> {t('surahs')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'juz'}
          onClick={() => setTab('juz')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === 'juz' ? 'bg-emerald-brand text-white' : 'bg-white text-ink border border-black/10 dark:bg-white/5 dark:text-white dark:border-white/15'
          }`}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" /> {t('juz')}
        </button>
      </div>

      {tab === 'surahs' && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/20 dark:border-white/15 dark:bg-white/5"
                aria-label={t('searchPlaceholder')}
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'Meccan', 'Medinan'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRevelationFilter(r)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    revelationFilter === r
                      ? 'bg-emerald-brand text-white'
                      : 'bg-white text-ink border border-black/10 dark:bg-white/5 dark:text-white dark:border-white/15'
                  }`}
                >
                  {r === 'all' ? t('surahs') : r === 'Meccan' ? t('meccan') : t('medinan')}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-black/5 bg-white p-6 text-center text-sm text-ink-soft dark:border-white/10 dark:bg-white/5 dark:text-white/60">
              {t('noResults')}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <SurahCard key={s.number} surah={s} onOpen={() => onOpenSurah(s.number)} progress={progressOf(s)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'juz' && openJuz === null && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setOpenJuz(n)}
              className="group flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-brand/40 hover:shadow-md dark:border-white/10 dark:bg-white/5"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-soft text-sm font-bold text-emerald-brand dark:bg-emerald-950 dark:text-emerald-300">
                  {n}
                </span>
                <span>
                  <span className="block font-semibold text-ink dark:text-white">
                    {t('juzLabel')} {n}
                  </span>
                  <span className="block text-xs text-ink-soft dark:text-white/55">{t('openJuz')}</span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-emerald-brand transition group-hover:translate-x-1" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {tab === 'juz' && openJuz !== null && (
        <JuzReader juzNumber={openJuz} surahs={surahs} onBack={() => setOpenJuz(null)} onOpenSurah={onOpenSurah} />
      )}
    </div>
  );
}

function JuzReader({
  juzNumber,
  surahs,
  onBack,
  onOpenSurah,
}: {
  juzNumber: number;
  surahs: SurahMeta[];
  onBack: () => void;
  onOpenSurah: (surah: number, ayah?: number) => void;
}) {
  const { t, settings } = useStore();
  const [data, setData] = useState<SurahData | null>(null);
  const [bn, setBn] = useState<SurahData | null>(null);
  const [en, setEn] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getJuz(juzNumber, 'quran-uthmani'),
      getJuz(juzNumber, settings.bnTranslation),
      getJuz(juzNumber, 'en.sahih'),
    ])
      .then(([ar, b, e]) => {
        setData(ar);
        setBn(b);
        setEn(e);
      })
      .catch(() => setError(t('errorLoading')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showBn = settings.readingMode === 'ar-bn' || settings.readingMode === 'ar-both';
  const showEn = settings.readingMode === 'ar-en' || settings.readingMode === 'ar-both';

  // Group ayahs by surah for display, attaching translations by global index.
  const groups = useMemo(() => {
    if (!data) return [];
    const out: { surah: number; ayahs: { ayah: (typeof data.ayahs)[number]; bangla: string; english: string }[] }[] = [];
    data.ayahs.forEach((a, idx) => {
      const s = a.surah?.number ?? 0;
      const entry = {
        ayah: a,
        bangla: bn?.ayahs[idx]?.text ?? '',
        english: en?.ayahs[idx]?.text ?? '',
      };
      const last = out[out.length - 1];
      if (last && last.surah === s) last.ayahs.push(entry);
      else out.push({ surah: s, ayahs: [entry] });
    });
    return out;
  }, [data, bn, en]);

  const firstAyah = data?.ayahs[0];
  const firstMeta = firstAyah?.surah ? surahs.find((s) => s.number === firstAyah.surah?.number) : undefined;

  return (
    <div className="animate-fade-in">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-brand hover:text-emerald-deep dark:text-emerald-300">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t('backToList')}
      </button>
      <div className="mb-5 rounded-3xl bg-gradient-to-br from-emerald-deep via-emerald-brand to-emerald-deep p-6 text-white shadow-lg">
        <h2 className="text-2xl font-extrabold">
          {t('juzLabel')} {juzNumber}
        </h2>
        {firstAyah && (
          <p className="mt-1 text-emerald-100/90">
            {t('juzStartsAt')}: {firstMeta?.englishName ?? ''} · {t('ayah')} {firstAyah.numberInSurah}
            {' · '}
            {data?.ayahs.length} {t('ayahs')}
          </p>
        )}
      </div>

      {loading && <ReaderSkeleton />}
      {error && <ErrorBox message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="space-y-6">
          {groups.map((g) => {
            const meta = surahs.find((s) => s.number === g.surah);
            return (
              <section key={g.surah}>
                <button
                  type="button"
                  onClick={() => onOpenSurah(g.surah, g.ayahs[0].ayah.numberInSurah)}
                  className="mb-3 flex w-full items-center justify-between rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:border-emerald-brand/40 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-soft text-sm font-bold text-emerald-brand dark:bg-emerald-950 dark:text-emerald-300">
                      {g.surah}
                    </span>
                    <span>
                      <span className="block font-bold text-ink dark:text-white">{meta?.englishName}</span>
                      <span className="block text-xs text-ink-soft dark:text-white/55">
                        {g.ayahs[0].ayah.numberInSurah} – {g.ayahs[g.ayahs.length - 1].ayah.numberInSurah} · {g.ayahs.length} {t('ayahs')}
                      </span>
                    </span>
                  </span>
                  <span className="arabic-name text-2xl text-emerald-deep dark:text-emerald-200">{meta?.name}</span>
                </button>
                <div className="space-y-3">
                  {g.ayahs.map(({ ayah: a, bangla: bnText, english: enText }) => {
                    return (
                      <article
                        key={`${a.surah?.number}-${a.numberInSurah}`}
                        className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="ayah-badge">{a.numberInSurah}</span>
                          <button
                            type="button"
                            onClick={() => onOpenSurah(g.surah, a.numberInSurah)}
                            className="text-xs font-bold text-emerald-brand hover:text-emerald-deep dark:text-emerald-300"
                          >
                            {t('read')} →
                          </button>
                        </div>
                        <p className="quran-text mt-2 text-right text-ink dark:text-white" style={{ fontSize: `${settings.arabicFontSize - 4}px` }} lang="ar">
                          {a.text.trim()}
                        </p>
                        {showBn && bnText && (
                          <p className="bangla-text mt-2 leading-relaxed text-ink-soft dark:text-white/75" style={{ fontSize: `${settings.translationFontSize - 1}px` }}>
                            {bnText}
                          </p>
                        )}
                        {showEn && enText && (
                          <p className="mt-1 leading-relaxed text-ink-soft dark:text-white/75" style={{ fontSize: `${settings.translationFontSize - 1}px` }}>
                            {enText}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
