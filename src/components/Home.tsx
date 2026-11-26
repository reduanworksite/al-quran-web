import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Bookmark, CalendarCheck, Flame, Heart, Play, Sparkles, Target, TrendingUp } from 'lucide-react';
import {
  BISMILLAH_TEXT,
  featuredSurahNumber,
  getSurah,
  globalAyahToSurah,
  stripBismillah,
  cleanArabic,
  hasBismillahHeader,
  todaysAyahNumber,
  TOTAL_AYAHS,
  TOTAL_SURAHS,
  type SurahMeta,
} from '../lib/api';
import { useStore } from '../lib/store';
import { ProgressBar, SectionTitle } from './ui';

interface Props {
  surahs: SurahMeta[];
  onOpenSurah: (surah: number, ayah?: number) => void;
  onGoSurahs: () => void;
  onGoDashboard: () => void;
}

interface TodayAyah {
  surah: number;
  ayah: number;
  arabic: string;
  bangla: string;
  english: string;
  surahName: string;
}

export default function Home({ surahs, onOpenSurah, onGoSurahs, onGoDashboard }: Props) {
  const { t, settings, updateSettings, readAyahs, lastRead, todayCount, completedSurahs, bookmarks, favorites } = useStore();
  const [today, setToday] = useState<TodayAyah | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState(false);

  const completed = completedSurahs(surahs);
  const progressPct = Math.round((readAyahs.size / TOTAL_AYAHS) * 1000) / 10;
  const featured = surahs.find((s) => s.number === featuredSurahNumber());
  const goalPct = settings.dailyGoal > 0 ? Math.min(100, Math.round((todayCount / settings.dailyGoal) * 100)) : 0;

  useEffect(() => {
    if (surahs.length === 0) return;
    let cancelled = false;
    const global = todaysAyahNumber();
    const { surah, ayah } = globalAyahToSurah(surahs, global);
    setTodayLoading(true);
    setTodayError(false);
    Promise.all([
      getSurah(surah, 'quran-uthmani'),
      getSurah(surah, 'bn.bengali'),
      getSurah(surah, 'en.sahih'),
    ])
      .then(([ar, bn, en]) => {
        if (cancelled) return;
        const idx = ayah - 1;
        let arText = cleanArabic(ar.ayahs[idx]?.text ?? '');
        if (ayah === 1 && hasBismillahHeader(surah)) arText = stripBismillah(arText);
        const meta = surahs.find((s) => s.number === surah);
        setToday({
          surah,
          ayah,
          arabic: arText,
          bangla: bn.ayahs[idx]?.text ?? '',
          english: en.ayahs[idx]?.text ?? '',
          surahName: meta?.englishName ?? '',
        });
      })
      .catch(() => {
        if (!cancelled) setTodayError(true);
      })
      .finally(() => {
        if (!cancelled) setTodayLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [surahs]);

  const lastReadMeta = lastRead ? surahs.find((s) => s.number === lastRead.surah) : null;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-deep via-emerald-brand to-[#14604a] p-6 text-white shadow-xl sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/20 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <p className="quran-text relative text-center text-3xl text-gold-soft sm:text-4xl" lang="ar">
          {BISMILLAH_TEXT}
        </p>
        <p className="relative mt-2 text-center text-sm text-emerald-100/90">{t('bismillah')}</p>
        <h1 className="relative mt-6 text-center text-3xl font-extrabold leading-tight sm:text-5xl">{t('welcome')}</h1>
        <p className="relative mx-auto mt-3 max-w-2xl text-center text-emerald-100/90">{t('welcomeSub')}</p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => onOpenSurah(lastRead ? lastRead.surah : 1, lastRead?.ayah)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-emerald-deep shadow transition hover:bg-gold-soft"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {lastRead ? t('continueReading') : t('startReading')}
          </button>
          <button
            type="button"
            onClick={onGoSurahs}
            className="inline-flex items-center gap-2 rounded-full border border-white/50 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" /> {t('surahs')}
          </button>
        </div>
        <div className="relative mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t('totalSurahs'), value: String(TOTAL_SURAHS) },
            { label: t('totalAyahs'), value: TOTAL_AYAHS.toLocaleString() },
            { label: t('ayahsRead'), value: String(readAyahs.size) },
            { label: t('surahsCompleted'), value: String(completed.length) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur">
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="mt-0.5 text-xs text-emerald-100/85">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Today's Ayah */}
      <section>
        <SectionTitle title={t('todaysAyah')} subtitle={t('madeWith')} />
        <div className="rounded-3xl border border-gold/40 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          {todayLoading && (
            <div className="space-y-3">
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          )}
          {todayError && !todayLoading && (
            <p className="text-sm text-red-600">{t('errorLoading')}</p>
          )}
          {today && !todayLoading && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-semibold text-gold">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {today.surahName} · {t('surah')} {today.surah} : {t('ayah')} {today.ayah}
              </div>
              <p className="quran-text mt-4 text-right text-2xl leading-relaxed text-ink sm:text-3xl dark:text-white" lang="ar">
                {today.arabic}
              </p>
              <p className="bangla-text mt-4 leading-relaxed text-ink-soft dark:text-white/75">{today.bangla}</p>
              <p className="mt-2 leading-relaxed text-ink-soft dark:text-white/75">{today.english}</p>
              <button
                type="button"
                onClick={() => onOpenSurah(today.surah, today.ayah)}
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-brand transition hover:text-emerald-deep dark:text-emerald-300"
              >
                {t('read')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Progress + Continue */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-brand" aria-hidden="true" />
            <h3 className="font-bold text-ink dark:text-white">{t('readingProgress')}</h3>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-deep dark:text-emerald-200">
            {readAyahs.size} <span className="text-base font-medium text-ink-soft dark:text-white/55">/ {TOTAL_AYAHS.toLocaleString()}</span>
          </p>
          <ProgressBar value={readAyahs.size} max={TOTAL_AYAHS} className="mt-3" />
          <p className="mt-2 text-sm text-ink-soft dark:text-white/60">{progressPct}% {t('readingProgress').toLowerCase()}</p>
          <button type="button" onClick={onGoDashboard} className="mt-4 text-sm font-bold text-emerald-brand hover:text-emerald-deep dark:text-emerald-300">
            {t('dashboard')} →
          </button>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-brand" aria-hidden="true" />
            <h3 className="font-bold text-ink dark:text-white">{t('dailyGoal')}</h3>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-deep dark:text-emerald-200">
            {todayCount} <span className="text-base font-medium text-ink-soft dark:text-white/55">/ {settings.dailyGoal} {t('ayahs')}</span>
          </p>
          <ProgressBar value={todayCount} max={settings.dailyGoal} className="mt-3" />
          <p className="mt-2 text-sm text-ink-soft dark:text-white/60">
            {goalPct >= 100 ? t('goalReached') : `${goalPct}% ${t('ofGoal')}`}
          </p>
          <label className="mt-4 block text-xs font-semibold text-ink-soft dark:text-white/60">
            {t('setGoal')}
            <input
              type="number"
              min={1}
              max={200}
              value={settings.dailyGoal}
              onChange={(e) => {
                const v = Math.max(1, Math.min(200, Number(e.target.value) || 10));
                updateSettings({ dailyGoal: v });
              }}
              className="mt-1 w-24 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-white/5"
              aria-label={t('setGoal')}
            />
          </label>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-emerald-brand" aria-hidden="true" />
            <h3 className="font-bold text-ink dark:text-white">{t('lastRead')}</h3>
          </div>
          {lastRead && lastReadMeta ? (
            <div className="mt-3">
              <p className="arabic-name text-2xl text-emerald-deep dark:text-emerald-200">{lastReadMeta.name}</p>
              <p className="mt-1 font-semibold text-ink dark:text-white">
                {lastReadMeta.englishName} · {t('ayah')} {lastRead.ayah}
              </p>
              <button
                type="button"
                onClick={() => onOpenSurah(lastRead.surah, lastRead.ayah)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-deep"
              >
                <Play className="h-4 w-4" aria-hidden="true" /> {t('continueReading')}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-soft dark:text-white/60">{t('noHistory')}</p>
          )}
          <div className="mt-4 flex gap-4 text-sm">
            <span className="inline-flex items-center gap-1 text-ink-soft dark:text-white/60">
              <Bookmark className="h-4 w-4 text-gold" aria-hidden="true" /> {bookmarks.length} {t('bookmarks')}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-soft dark:text-white/60">
              <Heart className="h-4 w-4 text-red-500" aria-hidden="true" /> {favorites.length} {t('favorites')}
            </span>
          </div>
        </div>
      </section>

      {/* Featured Surah + Quick Access */}
      {featured && (
        <section>
          <SectionTitle title={t('featuredSurah')} />
          <button
            type="button"
            onClick={() => onOpenSurah(featured.number)}
            className="group flex w-full flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-soft text-lg font-extrabold text-emerald-brand dark:bg-emerald-950 dark:text-emerald-300">
                {featured.number}
              </span>
              <div>
                <p className="text-lg font-bold text-ink dark:text-white">{featured.englishName}</p>
                <p className="text-sm text-ink-soft dark:text-white/55">
                  {featured.englishNameTranslation} · {featured.numberOfAyahs} {t('ayahs')} · {featured.revelationType === 'Meccan' ? t('meccan') : t('medinan')}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-3">
              <span className="arabic-name text-3xl text-emerald-deep dark:text-emerald-200">{featured.name}</span>
              <ArrowRight className="h-5 w-5 text-emerald-brand transition group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </button>
        </section>
      )}

      <section>
        <SectionTitle
          title={t('quickAccess')}
          action={
            <button type="button" onClick={onGoSurahs} className="text-sm font-bold text-emerald-brand hover:text-emerald-deep dark:text-emerald-300">
              {t('viewAllSurahs')} →
            </button>
          }
        />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 18, 36, 55, 56, 67, 112, 113, 114].map((n) => {
            const s = surahs.find((x) => x.number === n);
            if (!s) return null;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onOpenSurah(n)}
                className="rounded-full border border-emerald-brand/30 bg-white px-4 py-2 text-sm font-semibold text-emerald-brand transition hover:bg-emerald-soft dark:bg-white/5 dark:hover:bg-white/10"
              >
                {s.englishName}
              </button>
            );
          })}
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-3 py-2 text-xs font-semibold text-[#7a5c22] dark:bg-white/10 dark:text-gold">
            <Flame className="h-3.5 w-3.5" aria-hidden="true" /> {t('surahs')}: {TOTAL_SURAHS}
          </span>
        </div>
      </section>
    </div>
  );
}
