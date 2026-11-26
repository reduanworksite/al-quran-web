import { BookOpen, Bookmark, Clock, Flame, Heart, Play, Target, Trash2, TrendingUp } from 'lucide-react';
import { TOTAL_AYAHS, type SurahMeta } from '../lib/api';
import { useStore } from '../lib/store';
import { ProgressBar, SectionTitle } from './ui';

interface Props {
  surahs: SurahMeta[];
  onOpenSurah: (surah: number, ayah?: number) => void;
}

function timeAgo(at: number, lang: 'en' | 'bn'): string {
  const diff = Date.now() - at;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'bn' ? 'এইমাত্র' : 'just now';
  if (mins < 60) return lang === 'bn' ? `${mins} মিনিট আগে` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'bn' ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === 'bn' ? `${days} দিন আগে` : `${days}d ago`;
}

export default function Dashboard({ surahs, onOpenSurah }: Props) {
  const { t, settings, updateSettings, readAyahs, bookmarks, favorites, history, clearHistory, lastRead, todayCount, completedSurahs } = useStore();
  const completed = completedSurahs(surahs);
  const goalPct = settings.dailyGoal > 0 ? Math.min(100, Math.round((todayCount / settings.dailyGoal) * 100)) : 0;
  const lastReadMeta = lastRead ? surahs.find((s) => s.number === lastRead.surah) : null;

  const stats = [
    { icon: BookOpen, label: t('ayahsRead'), value: String(readAyahs.size), sub: `/ ${TOTAL_AYAHS.toLocaleString()}` },
    { icon: TrendingUp, label: t('surahsCompleted'), value: String(completed.length), sub: '/ 114' },
    { icon: Target, label: t('totalReadToday'), value: String(todayCount), sub: `/ ${settings.dailyGoal} ${t('ayahs')}` },
    { icon: Bookmark, label: t('bookmarks'), value: String(bookmarks.length), sub: '' },
    { icon: Heart, label: t('favorites'), value: String(favorites.length), sub: '' },
    { icon: Clock, label: t('history'), value: String(history.length), sub: '' },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      <SectionTitle title={t('dashboard')} subtitle={t('readingProgress')} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <s.icon className="h-5 w-5 text-emerald-brand" aria-hidden="true" />
            <p className="mt-2 text-2xl font-extrabold text-ink dark:text-white">
              {s.value} <span className="text-xs font-medium text-ink-soft dark:text-white/55">{s.sub}</span>
            </p>
            <p className="text-xs text-ink-soft dark:text-white/60">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Goal + Continue */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-gold" aria-hidden="true" />
            <h3 className="font-bold text-ink dark:text-white">{t('dailyGoal')}</h3>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-deep dark:text-emerald-200">
            {todayCount} <span className="text-base font-medium text-ink-soft dark:text-white/55">/ {settings.dailyGoal} {t('ayahs')}</span>
          </p>
          <ProgressBar value={todayCount} max={settings.dailyGoal} className="mt-3" />
          <p className="mt-2 text-sm text-ink-soft dark:text-white/60">
            {goalPct >= 100 ? t('goalReached') : `${goalPct}% ${t('ofGoal')}`}
          </p>
          <label className="mt-4 block text-sm font-semibold text-ink dark:text-white">
            {t('setGoal')}
            <input
              type="number"
              min={1}
              max={200}
              value={settings.dailyGoal}
              onChange={(e) => updateSettings({ dailyGoal: Math.max(1, Math.min(200, Number(e.target.value) || 10)) })}
              className="ml-2 w-20 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-white/5"
              aria-label={t('setGoal')}
            />
          </label>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="font-bold text-ink dark:text-white">{t('continueReading')}</h3>
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
        </div>
      </div>

      {/* Bookmarks */}
      <section>
        <SectionTitle title={t('bookmarks')} subtitle={`${bookmarks.length} ${t('bookmarks').toLowerCase()}`} />
        {bookmarks.length === 0 ? (
          <p className="rounded-2xl border border-black/5 bg-white p-5 text-sm text-ink-soft dark:border-white/10 dark:bg-white/5 dark:text-white/60">{t('noBookmarks')}</p>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b) => {
              const meta = surahs.find((s) => s.number === b.surah);
              return (
                <button
                  key={`${b.surah}-${b.ayah}`}
                  type="button"
                  onClick={() => onOpenSurah(b.surah, b.ayah)}
                  className="block w-full rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:border-gold/60 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="text-sm font-bold text-emerald-brand dark:text-emerald-300">
                    {meta?.englishName} · {t('surah')} {b.surah} : {t('ayah')} {b.ayah}
                  </span>
                  <span className="quran-text mt-2 block text-right text-xl text-ink dark:text-white" lang="ar">{b.text}</span>
                  <span className="mt-1 block text-xs text-ink-soft dark:text-white/50">{timeAgo(b.at, settings.uiLang)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Favorites */}
      <section>
        <SectionTitle title={t('favorites')} subtitle={`${favorites.length} ${t('favorites').toLowerCase()}`} />
        {favorites.length === 0 ? (
          <p className="rounded-2xl border border-black/5 bg-white p-5 text-sm text-ink-soft dark:border-white/10 dark:bg-white/5 dark:text-white/60">{t('noFavorites')}</p>
        ) : (
          <div className="space-y-3">
            {favorites.map((b) => {
              const meta = surahs.find((s) => s.number === b.surah);
              return (
                <button
                  key={`${b.surah}-${b.ayah}`}
                  type="button"
                  onClick={() => onOpenSurah(b.surah, b.ayah)}
                  className="block w-full rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:border-red-300 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="text-sm font-bold text-red-500">
                    {meta?.englishName} · {t('surah')} {b.surah} : {t('ayah')} {b.ayah}
                  </span>
                  <span className="quran-text mt-2 block text-right text-xl text-ink dark:text-white" lang="ar">{b.text}</span>
                  <span className="mt-1 block text-xs text-ink-soft dark:text-white/50">{timeAgo(b.at, settings.uiLang)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <SectionTitle
          title={t('history')}
          action={
            history.length > 0 ? (
              <button
                type="button"
                onClick={clearHistory}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> {t('clearHistory')}
              </button>
            ) : undefined
          }
        />
        {history.length === 0 ? (
          <p className="rounded-2xl border border-black/5 bg-white p-5 text-sm text-ink-soft dark:border-white/10 dark:bg-white/5 dark:text-white/60">{t('noHistory')}</p>
        ) : (
          <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
            {history.slice(0, 30).map((h) => {
              const meta = surahs.find((s) => s.number === h.surah);
              return (
                <button
                  key={`${h.surah}-${h.ayah}-${h.at}`}
                  type="button"
                  onClick={() => onOpenSurah(h.surah, h.ayah)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-emerald-soft/50 dark:hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-ink dark:text-white">
                    {meta?.englishName} · {t('ayah')} {h.ayah}
                  </span>
                  <span className="text-xs text-ink-soft dark:text-white/55">{timeAgo(h.at, settings.uiLang)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
