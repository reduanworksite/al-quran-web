import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  Maximize,
  Minimize,
  Play,
  Settings2,
  Volume2,
  X,
} from 'lucide-react';
import {
  BISMILLAH_TEXT,
  cleanArabic,
  getSurah,
  hasBismillahHeader,
  RECITERS,
  BN_TRANSLATIONS,
  stripBismillah,
  type SurahData,
  type SurahMeta,
} from '../lib/api';
import { useStore, type ReadingMode } from '../lib/store';
import AudioPlayer from './AudioPlayer';
import { ErrorBox, ReaderSkeleton } from './ui';

interface Props {
  surahNumber: number;
  targetAyah?: number | null;
  surahs: SurahMeta[];
  onNavigate: (surah: number, ayah?: number) => void;
  onBackToList: () => void;
}

const MODES: { id: ReadingMode; labelKey: 'arabicOnly' | 'arabicBangla' | 'arabicEnglish' | 'arabicBoth' }[] = [
  { id: 'ar', labelKey: 'arabicOnly' },
  { id: 'ar-bn', labelKey: 'arabicBangla' },
  { id: 'ar-en', labelKey: 'arabicEnglish' },
  { id: 'ar-both', labelKey: 'arabicBoth' },
];

export default function Reader({ surahNumber, targetAyah, surahs, onNavigate, onBackToList }: Props) {
  const { settings, updateSettings, t, toggleRead, isRead, toggleBookmark, isBookmarked, toggleFavorite, isFavorite } = useStore();
  const [arabic, setArabic] = useState<SurahData | null>(null);
  const [bn, setBn] = useState<SurahData | null>(null);
  const [en, setEn] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const meta = surahs.find((s) => s.number === surahNumber);

  const load = () => {
    setLoading(true);
    setError('');
    setPlayingAyah(null);
    Promise.all([
      getSurah(surahNumber, 'quran-uthmani'),
      getSurah(surahNumber, settings.bnTranslation),
      getSurah(surahNumber, 'en.sahih'),
    ])
      .then(([ar, b, e]) => {
        setArabic(ar);
        setBn(b);
        setEn(e);
      })
      .catch(() => setError(t('errorLoading')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [surahNumber, settings.bnTranslation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to + highlight target ayah (from search/bookmark/dashboard).
  useEffect(() => {
    if (!loading && targetAyah) {
      const el = document.getElementById(`ayah-${targetAyah}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, targetAyah]);

  useEffect(() => {
    if (isFullscreen) containerRef.current?.requestFullscreen?.().catch(() => undefined);
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  }, [isFullscreen]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  const combined = useMemo(() => {
    if (!arabic) return [];
    return arabic.ayahs.map((a, i) => {
      const bnAyah = bn?.ayahs[i];
      const enAyah = en?.ayahs[i];
      let arText = cleanArabic(a.text);
      if (a.numberInSurah === 1 && hasBismillahHeader(surahNumber)) {
        arText = stripBismillah(arText);
      }
      return {
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        arabic: arText,
        bangla: bnAyah ? bnAyah.text : '',
        english: enAyah ? enAyah.text : '',
        rawArabic: cleanArabic(a.text),
      };
    });
  }, [arabic, bn, en, surahNumber]);

  const copyAyah = async (item: (typeof combined)[number]) => {
    const parts = [item.arabic];
    if (settings.readingMode !== 'ar' && item.bangla) parts.push(item.bangla);
    if ((settings.readingMode === 'ar-en' || settings.readingMode === 'ar-both') && item.english) parts.push(item.english);
    parts.push(`— ${meta?.englishName ?? ''} ${surahNumber}:${item.numberInSurah}`);
    try {
      await navigator.clipboard.writeText(parts.join('\n'));
      setCopiedKey(`${item.numberInSurah}`);
      window.setTimeout(() => setCopiedKey(null), 1500);
      showToast(t('copied'));
    } catch {
      /* clipboard unavailable */
    }
  };

  const mode = settings.readingMode;
  const showBn = mode === 'ar-bn' || mode === 'ar-both';
  const showEn = mode === 'ar-en' || mode === 'ar-both';

  return (
    <div ref={containerRef} className="animate-fade-up bg-cream dark:bg-[#0d1a14]">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-deep via-emerald-brand to-emerald-deep p-6 text-white shadow-lg sm:p-8">
        <button type="button" onClick={onBackToList} className="mb-4 inline-flex items-center gap-1 text-sm text-emerald-100 transition hover:text-white">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t('backToList')}
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-wide text-emerald-100/90">
              {t('surah')} {surahNumber} · {meta?.revelationType === 'Meccan' ? t('meccan') : t('medinan')}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{meta?.englishName}</h1>
            <p className="mt-1 text-emerald-100/90">{meta?.englishNameTranslation}</p>
            <p className="mt-2 text-sm text-emerald-100/80">
              {meta?.numberOfAyahs} {t('ayahs')}
            </p>
          </div>
          <p className="arabic-name text-5xl leading-tight text-gold-soft sm:text-6xl">{meta?.name}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowPlayer(true);
              setPlayingAyah(1);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-deep shadow transition hover:bg-gold-soft"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" /> {t('playSurah')}
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            aria-expanded={showSettings}
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" /> {t('readingMode')}
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" aria-hidden="true" /> : <Maximize className="h-4 w-4" aria-hidden="true" />}
            {isFullscreen ? t('exitFullscreen') : t('fullscreen')}
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm animate-fade-in dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink dark:text-white">{t('readingMode')}</h3>
            <button type="button" onClick={() => setShowSettings(false)} aria-label="Close settings" className="rounded-full p-1 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateSettings({ readingMode: m.id })}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === m.id ? 'bg-emerald-brand text-white' : 'bg-black/5 text-ink hover:bg-emerald-soft dark:bg-white/10 dark:text-white dark:hover:bg-white/15'
                }`}
              >
                {t(m.labelKey)}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="ar-size" className="text-sm font-semibold text-ink dark:text-white">
                {t('arabicFontSize')}: {settings.arabicFontSize}px
              </label>
              <input
                id="ar-size"
                type="range"
                min={20}
                max={48}
                value={settings.arabicFontSize}
                onChange={(e) => updateSettings({ arabicFontSize: Number(e.target.value) })}
                className="mt-2 w-full cursor-pointer"
              />
              <p className="quran-text mt-1 text-right text-emerald-deep dark:text-emerald-200" style={{ fontSize: `${Math.min(settings.arabicFontSize, 34)}px` }}>
                {BISMILLAH_TEXT}
              </p>
            </div>
            <div>
              <label htmlFor="tr-size" className="text-sm font-semibold text-ink dark:text-white">
                {t('translationFontSize')}: {settings.translationFontSize}px
              </label>
              <input
                id="tr-size"
                type="range"
                min={13}
                max={24}
                value={settings.translationFontSize}
                onChange={(e) => updateSettings({ translationFontSize: Number(e.target.value) })}
                className="mt-2 w-full cursor-pointer"
              />
              <p className="bangla-text mt-1 text-ink-soft dark:text-white/70" style={{ fontSize: `${settings.translationFontSize}px` }}>
                পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে
              </p>
            </div>
            <div>
              <label htmlFor="bn-tr" className="text-sm font-semibold text-ink dark:text-white">
                {t('banglaTranslation')}
              </label>
              <select
                id="bn-tr"
                value={settings.bnTranslation}
                onChange={(e) => updateSettings({ bnTranslation: e.target.value })}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
              >
                {BN_TRANSLATIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="reciter" className="text-sm font-semibold text-ink dark:text-white">
                {t('reciter')}
              </label>
              <select
                id="reciter"
                value={settings.reciter}
                onChange={(e) => updateSettings({ reciter: e.target.value })}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.style})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-soft dark:text-white/50">
            {t('translationCreditBn')} · {t('translationCreditEn')}
          </p>
        </div>
      )}

      {/* Content */}
      {loading && (
        <div className="mt-6">
          <ReaderSkeleton />
        </div>
      )}
      {error && (
        <div className="mt-6">
          <ErrorBox message={error} onRetry={load} />
        </div>
      )}

      {!loading && !error && arabic && (
        <div className="mt-6">
          {/* Bismillah header (surahs 2-114 except 9; surah 1 ayah 1 IS the Bismillah) */}
          {hasBismillahHeader(surahNumber) && (
            <p className="quran-text mb-6 text-center text-3xl text-emerald-deep sm:text-4xl dark:text-emerald-200" lang="ar">
              {BISMILLAH_TEXT}
            </p>
          )}

          <div className="space-y-4">
            {combined.map((item) => {
              const read = isRead(surahNumber, item.numberInSurah);
              const bookmarked = isBookmarked(surahNumber, item.numberInSurah);
              const fav = isFavorite(surahNumber, item.numberInSurah);
              const isTarget = targetAyah === item.numberInSurah;
              const isPlaying = playingAyah === item.numberInSurah;
              return (
                <article
                  key={item.numberInSurah}
                  id={`ayah-${item.numberInSurah}`}
                  className={`scroll-mt-32 rounded-2xl border p-5 shadow-sm transition ${
                    isPlaying
                      ? 'border-emerald-brand bg-emerald-soft/70 dark:border-emerald-400 dark:bg-emerald-950/60'
                      : isTarget
                        ? 'border-gold bg-gold-soft/60 dark:border-gold dark:bg-white/10'
                        : 'border-black/5 bg-white dark:border-white/10 dark:bg-white/5'
                  } ${read ? 'opacity-90' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="ayah-badge">{item.numberInSurah}</span>
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-ink-soft dark:bg-white/10 dark:text-white/60">
                        {t('juzLabel')} {item.juz}
                      </span>
                      {read && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 text-xs font-semibold text-emerald-brand dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="h-3 w-3" aria-hidden="true" /> {t('markedRead')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPlayer(true);
                          setPlayingAyah(item.numberInSurah);
                        }}
                        className="rounded-full p-2 text-emerald-brand transition hover:bg-emerald-soft dark:hover:bg-white/10"
                        aria-label={`${t('play')} ${t('ayah')} ${item.numberInSurah}`}
                        title={t('play')}
                      >
                        <Play className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(surahNumber, item.numberInSurah, item.arabic)}
                        className={`rounded-full p-2 transition hover:bg-emerald-soft dark:hover:bg-white/10 ${bookmarked ? 'text-gold' : 'text-ink-soft dark:text-white/60'}`}
                        aria-label={t('bookmarks')}
                        title={t('bookmarks')}
                      >
                        <Bookmark className="h-4 w-4" fill={bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(surahNumber, item.numberInSurah, item.arabic)}
                        className={`rounded-full p-2 transition hover:bg-emerald-soft dark:hover:bg-white/10 ${fav ? 'text-red-500' : 'text-ink-soft dark:text-white/60'}`}
                        aria-label={t('favorites')}
                        title={t('favorites')}
                      >
                        <Heart className="h-4 w-4" fill={fav ? 'currentColor' : 'none'} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyAyah(item)}
                        className="rounded-full p-2 text-ink-soft transition hover:bg-emerald-soft dark:text-white/60 dark:hover:bg-white/10"
                        aria-label={t('copy')}
                        title={t('copy')}
                      >
                        {copiedKey === String(item.numberInSurah) ? <Check className="h-4 w-4 text-emerald-brand" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRead(surahNumber, item.numberInSurah)}
                    className="mt-3 block w-full text-right"
                    title={t('markedRead')}
                  >
                    <span className="quran-text text-ink dark:text-white" style={{ fontSize: `${settings.arabicFontSize}px` }} lang="ar">
                      {item.arabic}
                    </span>
                  </button>

                  {showBn && item.bangla && (
                    <p className="bangla-text mt-3 leading-relaxed text-ink-soft dark:text-white/75" style={{ fontSize: `${settings.translationFontSize}px` }}>
                      {item.bangla}
                    </p>
                  )}
                  {showEn && item.english && (
                    <p className="mt-2 leading-relaxed text-ink-soft dark:text-white/75" style={{ fontSize: `${settings.translationFontSize}px` }}>
                      {item.english}
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {/* End of surah + prev/next */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={surahNumber <= 1}
              onClick={() => onNavigate(surahNumber - 1)}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-emerald-brand transition hover:bg-emerald-soft disabled:opacity-40 dark:border-white/15 dark:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t('prevSurah')}
            </button>
            <p className="text-center text-sm text-ink-soft dark:text-white/55">
              {t('translationCreditBn')}
              <br />
              {t('translationCreditEn')}
            </p>
            <button
              type="button"
              disabled={surahNumber >= 114}
              onClick={() => onNavigate(surahNumber + 1)}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-deep disabled:opacity-40"
            >
              {t('nextSurah')} <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {showPlayer && arabic && (
        <AudioPlayer
          surahNumber={surahNumber}
          ayahCount={arabic.numberOfAyahs}
          playingAyah={playingAyah}
          onPlayingAyah={setPlayingAyah}
          onClose={() => {
            setPlayingAyah(null);
            setShowPlayer(false);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-deep px-4 py-2 text-sm font-semibold text-white shadow-lg animate-fade-in" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
