import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Home as HomeIcon, LayoutDashboard, Moon, Search as SearchIcon, Sun, BookMarked } from 'lucide-react';
import { getSurahList, type SurahMeta } from './lib/api';
import { StoreProvider, useStore } from './lib/store';
import Home from './components/Home';
import SurahList from './components/SurahList';
import Reader from './components/Reader';
import SearchView from './components/SearchView';
import Dashboard from './components/Dashboard';
import { ErrorBox, SurahListSkeleton } from './components/ui';

type View = 'home' | 'surahs' | 'reader' | 'search' | 'dashboard';

function Shell() {
  const { t, settings, updateSettings } = useStore();
  const [view, setView] = useState<View>('home');
  const [readerTarget, setReaderTarget] = useState<{ surah: number; ayah?: number }>({ surah: 1 });
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const loadList = useCallback(() => {
    setListLoading(true);
    setListError('');
    getSurahList()
      .then(setSurahs)
      .catch(() => setListError(t('errorLoading')))
      .finally(() => setListLoading(false));
  }, [t]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openSurah = useCallback((surah: number, ayah?: number) => {
    setReaderTarget({ surah, ayah });
    setView('reader');
    window.scrollTo({ top: 0 });
  }, []);

  const goView = useCallback((v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);

  const navItems: { id: View; label: string; icon: typeof HomeIcon }[] = [
    { id: 'home', label: t('home'), icon: HomeIcon },
    { id: 'surahs', label: t('surahs'), icon: BookOpen },
    { id: 'search', label: t('search'), icon: SearchIcon },
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-cream text-ink dark:bg-[#0d1a14] dark:text-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-cream/90 backdrop-blur dark:border-white/10 dark:bg-[#0d1a14]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={() => goView('home')} className="flex items-center gap-2.5" aria-label={t('appName')}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-deep text-gold-soft shadow">
              <BookMarked className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-lg font-extrabold text-emerald-deep dark:text-emerald-100">{t('appName')}</span>
              <span className="hidden text-[11px] font-medium tracking-wide text-ink-soft sm:block dark:text-white/55">{t('tagline')}</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goView(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  view === item.id || (view === 'reader' && item.id === 'surahs')
                    ? 'bg-emerald-brand text-white'
                    : 'text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
                }`}
                aria-current={view === item.id ? 'page' : undefined}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateSettings({ uiLang: settings.uiLang === 'en' ? 'bn' : 'en' })}
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-emerald-brand transition hover:bg-emerald-soft dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label={t('language')}
            >
              {settings.uiLang === 'en' ? 'বাংলা' : 'English'}
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="rounded-full border border-black/10 bg-white p-2 text-emerald-brand transition hover:bg-emerald-soft dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label={settings.theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {settings.theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-12">
        {listLoading && view !== 'reader' && (
          <div>
            <div className="mb-4 flex gap-3">
              <div className="skeleton h-10 w-32" />
              <div className="skeleton h-10 w-32" />
            </div>
            <SurahListSkeleton />
          </div>
        )}
        {listError && (
          <ErrorBox message={listError} onRetry={loadList} />
        )}
        {!listLoading && !listError && (
          <>
            {view === 'home' && (
              <Home surahs={surahs} onOpenSurah={openSurah} onGoSurahs={() => goView('surahs')} onGoDashboard={() => goView('dashboard')} />
            )}
            {view === 'surahs' && <SurahList surahs={surahs} onOpenSurah={openSurah} />}
            {view === 'reader' && (
              <Reader
                key={`${readerTarget.surah}`}
                surahNumber={readerTarget.surah}
                targetAyah={readerTarget.ayah ?? null}
                surahs={surahs}
                onNavigate={(n, ayah) => openSurah(n, ayah)}
                onBackToList={() => goView('surahs')}
              />
            )}
            {view === 'search' && <SearchView surahs={surahs} onOpenSurah={openSurah} />}
            {view === 'dashboard' && <Dashboard surahs={surahs} onOpenSurah={openSurah} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white/60 py-8 dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="quran-text text-xl text-emerald-deep dark:text-emerald-200" lang="ar">
            خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
          </p>
          <p className="mt-1 text-xs text-ink-soft dark:text-white/55">
            “The best of you are those who learn the Quran and teach it.” — Sahih al-Bukhari 5027
          </p>
          <p className="mt-4 text-xs text-ink-soft dark:text-white/55">{t('dataSource')}</p>
          <p className="mt-1 text-xs text-ink-soft dark:text-white/55">
            {t('translationCreditBn')} · {t('translationCreditEn')}
          </p>
          <p className="mt-3 text-xs font-semibold text-emerald-brand dark:text-emerald-300">{t('madeWith')}</p>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur md:hidden dark:border-white/10 dark:bg-[#122019]/95"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goView(item.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                view === item.id || (view === 'reader' && item.id === 'surahs')
                  ? 'text-emerald-brand dark:text-emerald-300'
                  : 'text-ink-soft dark:text-white/55'
              }`}
              aria-current={view === item.id ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
