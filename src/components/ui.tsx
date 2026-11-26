import type { ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { SurahMeta } from '../lib/api';
import { useStore } from '../lib/store';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SurahListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-2 h-4 w-40" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ReaderSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <Skeleton className="ml-auto h-8 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useStore();
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-900/50 dark:bg-red-950/40" role="alert">
      <AlertTriangle className="mx-auto h-7 w-7 text-red-500" aria-hidden="true" />
      <p className="mt-2 font-medium text-red-800 dark:text-red-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> {t('retry')}
        </button>
      )}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-emerald-deep dark:text-emerald-100 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-soft dark:text-white/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SurahCard({
  surah,
  onOpen,
  progress,
}: {
  surah: SurahMeta;
  onOpen: () => void;
  progress?: number; // 0..1 fraction of ayahs read
}) {
  const { t } = useStore();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-brand/40 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-soft text-sm font-bold text-emerald-brand dark:bg-emerald-950 dark:text-emerald-300">
            {surah.number}
          </span>
          <div>
            <p className="font-semibold text-ink dark:text-white">{surah.englishName}</p>
            <p className="text-xs text-ink-soft dark:text-white/55">
              {surah.englishNameTranslation} · {surah.numberOfAyahs} {t('ayahs')}
            </p>
          </div>
        </div>
        <span className="arabic-name text-xl leading-8 text-emerald-deep dark:text-emerald-200">{surah.name}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="rounded-full bg-gold-soft px-2.5 py-1 font-medium text-[#7a5c22] dark:bg-white/10 dark:text-gold">
          {surah.revelationType === 'Meccan' ? t('meccan') : t('medinan')}
        </span>
        {progress !== undefined && progress > 0 && (
          <span className="font-medium text-emerald-brand dark:text-emerald-300">
            {Math.round(progress * 100)}%
          </span>
        )}
      </div>
      {progress !== undefined && progress > 0 && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-full rounded-full bg-emerald-brand transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </button>
  );
}

export function ProgressBar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10 ${className}`} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-brand to-gold transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
