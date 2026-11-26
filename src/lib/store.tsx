import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SurahMeta } from './api';
import { STRINGS, type StringKey, type UiLang } from './i18n';

export type ReadingMode = 'ar' | 'ar-bn' | 'ar-en' | 'ar-both';

export interface SavedAyah {
  surah: number;
  ayah: number;
  text: string;
  at: number;
}

export interface HistoryItem {
  surah: number;
  ayah: number;
  at: number;
}

interface Settings {
  theme: 'light' | 'dark';
  uiLang: UiLang;
  readingMode: ReadingMode;
  arabicFontSize: number;
  translationFontSize: number;
  reciter: string;
  bnTranslation: string;
  volume: number;
  speed: number;
  dailyGoal: number;
}

interface StoreValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  t: (key: StringKey) => string;
  readAyahs: Set<string>;
  toggleRead: (surah: number, ayah: number) => void;
  isRead: (surah: number, ayah: number) => boolean;
  bookmarks: SavedAyah[];
  toggleBookmark: (surah: number, ayah: number, text: string) => void;
  isBookmarked: (surah: number, ayah: number) => boolean;
  favorites: SavedAyah[];
  toggleFavorite: (surah: number, ayah: number, text: string) => void;
  isFavorite: (surah: number, ayah: number) => boolean;
  history: HistoryItem[];
  clearHistory: () => void;
  lastRead: { surah: number; ayah: number } | null;
  todayCount: number;
  completedSurahs: (surahs: SurahMeta[]) => number[];
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  uiLang: 'en',
  readingMode: 'ar-both',
  arabicFontSize: 30,
  translationFontSize: 17,
  reciter: 'ar.alafasy',
  bnTranslation: 'bn.bengali',
  volume: 0.9,
  speed: 1,
  dailyGoal: 10,
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

const StoreContext = createContext<StoreValue | null>(null);

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>('aq_settings_v1', {}) }),
  );
  const [readList, setReadList] = useState<string[]>(() => load<string[]>('aq_read_v1', []));
  const [bookmarks, setBookmarks] = useState<SavedAyah[]>(() => load<SavedAyah[]>('aq_bookmarks_v1', []));
  const [favorites, setFavorites] = useState<SavedAyah[]>(() => load<SavedAyah[]>('aq_favorites_v1', []));
  const [history, setHistory] = useState<HistoryItem[]>(() => load<HistoryItem[]>('aq_history_v1', []));
  const [lastRead, setLastRead] = useState<{ surah: number; ayah: number } | null>(() =>
    load<{ surah: number; ayah: number } | null>('aq_lastread_v1', null),
  );

  useEffect(() => save('aq_settings_v1', settings), [settings]);
  useEffect(() => save('aq_read_v1', readList), [readList]);
  useEffect(() => save('aq_bookmarks_v1', bookmarks), [bookmarks]);
  useEffect(() => save('aq_favorites_v1', favorites), [favorites]);
  useEffect(() => save('aq_history_v1', history), [history]);
  useEffect(() => save('aq_lastread_v1', lastRead), [lastRead]);

  // Apply theme class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const readAyahs = useMemo(() => new Set(readList), [readList]);

  const todayCount = useMemo(() => {
    const today = todayKey();
    return history.filter((h) => todayKey(new Date(h.at)) === today).length;
  }, [history]);

  const value: StoreValue = {
    settings,
    updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),
    t: (key) => STRINGS[settings.uiLang][key] ?? STRINGS.en[key] ?? key,
    readAyahs,
    toggleRead: (surah, ayah) => {
      const k = `${surah}:${ayah}`;
      const now = Date.now();
      setReadList((prev) => {
        if (prev.includes(k)) return prev.filter((x) => x !== k);
        return [...prev, k];
      });
      setHistory((prev) => {
        if (prev.some((h) => h.surah === surah && h.ayah === ayah && todayKey(new Date(h.at)) === todayKey())) {
          return prev;
        }
        return [{ surah, ayah, at: now }, ...prev].slice(0, 300);
      });
      setLastRead({ surah, ayah });
    },
    isRead: (surah, ayah) => readAyahs.has(`${surah}:${ayah}`),
    bookmarks,
    toggleBookmark: (surah, ayah, text) => {
      setBookmarks((prev) => {
        if (prev.some((b) => b.surah === surah && b.ayah === ayah)) {
          return prev.filter((b) => !(b.surah === surah && b.ayah === ayah));
        }
        return [{ surah, ayah, text, at: Date.now() }, ...prev];
      });
    },
    isBookmarked: (surah, ayah) => bookmarks.some((b) => b.surah === surah && b.ayah === ayah),
    favorites,
    toggleFavorite: (surah, ayah, text) => {
      setFavorites((prev) => {
        if (prev.some((b) => b.surah === surah && b.ayah === ayah)) {
          return prev.filter((b) => !(b.surah === surah && b.ayah === ayah));
        }
        return [{ surah, ayah, text, at: Date.now() }, ...prev];
      });
    },
    isFavorite: (surah, ayah) => favorites.some((b) => b.surah === surah && b.ayah === ayah),
    history,
    clearHistory: () => setHistory([]),
    lastRead,
    todayCount,
    completedSurahs: (surahs) =>
      surahs
        .filter((s) => {
          for (let a = 1; a <= s.numberOfAyahs; a++) {
            if (!readAyahs.has(`${s.number}:${a}`)) return false;
          }
          return true;
        })
        .map((s) => s.number),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
