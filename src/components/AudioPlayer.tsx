import { useEffect, useRef, useState } from 'react';
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { getSurah, RECITERS, type Ayah } from '../lib/api';
import { useStore } from '../lib/store';

interface Props {
  surahNumber: number;
  ayahCount: number;
  playingAyah: number | null;
  onPlayingAyah: (n: number | null) => void;
  onClose: () => void;
}

export default function AudioPlayer({ surahNumber, ayahCount, playingAyah, onPlayingAyah, onClose }: Props) {
  const { settings, updateSettings, t } = useStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioAyahs, setAudioAyahs] = useState<Ayah[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatAyah, setRepeatAyah] = useState(false);
  const [repeatSurah, setRepeatSurah] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState('');
  const playingRef = useRef<number | null>(null);
  playingRef.current = playingAyah;

  // Load the audio edition for this surah + reciter.
  useEffect(() => {
    let cancelled = false;
    setLoadingAudio(true);
    setAudioError('');
    getSurah(surahNumber, settings.reciter)
      .then((data) => {
        if (!cancelled) setAudioAyahs(data.ayahs.filter((a) => a.audio));
      })
      .catch(() => {
        if (!cancelled) setAudioError(t('errorLoading'));
      })
      .finally(() => {
        if (!cancelled) setLoadingAudio(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNumber, settings.reciter]);

  // When the target ayah changes, load + play it.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingAyah === null) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    const entry = audioAyahs.find((a) => a.numberInSurah === playingAyah);
    if (!entry?.audio) return;
    if (audio.src !== entry.audio) audio.src = entry.audio;
    audio.playbackRate = settings.speed;
    audio.volume = settings.volume;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingAyah, audioAyahs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = settings.speed;
      audio.volume = settings.volume;
    }
  }, [settings.speed, settings.volume]);

  const goToAyah = (n: number) => {
    if (n < 1) n = repeatSurah ? ayahCount : 1;
    if (n > ayahCount) n = repeatSurah ? 1 : ayahCount;
    onPlayingAyah(n);
  };

  const handleEnded = () => {
    const cur = playingRef.current;
    if (cur === null) return;
    if (repeatAyah) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => undefined);
      }
      return;
    }
    if (cur < ayahCount) goToAyah(cur + 1);
    else if (repeatSurah) goToAyah(1);
    else {
      setIsPlaying(false);
      onPlayingAyah(null);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else if (playingAyah === null) {
      onPlayingAyah(1);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => undefined);
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || s <= 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const reciterName = RECITERS.find((r) => r.id === settings.reciter)?.name ?? settings.reciter;

  return (
    <div className="sticky bottom-0 z-30 mt-6 animate-fade-up rounded-t-2xl border border-black/10 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/10 dark:bg-[#122019]/95">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        onError={() => setAudioError(t('errorLoading'))}
        preload="metadata"
      />
      {/* Progress */}
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-ink-soft dark:text-white/60">
        <span className="w-10 text-right tabular-nums">{fmt(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => {
            const audio = audioRef.current;
            if (audio) audio.currentTime = Number(e.target.value);
            setCurrentTime(Number(e.target.value));
          }}
          className="h-1.5 flex-1 cursor-pointer"
          aria-label="Audio progress"
        />
        <span className="w-10 tabular-nums">{fmt(duration)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToAyah((playingAyah ?? 1) - 1)}
          className="rounded-full p-2 text-emerald-brand transition hover:bg-emerald-soft dark:hover:bg-white/10"
          aria-label={t('prevAyah')}
        >
          <SkipBack className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          disabled={loadingAudio || audioAyahs.length === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-brand text-white shadow transition hover:bg-emerald-deep disabled:opacity-50"
          aria-label={isPlaying ? t('pause') : t('play')}
        >
          {isPlaying ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => goToAyah((playingAyah ?? 0) + 1)}
          className="rounded-full p-2 text-emerald-brand transition hover:bg-emerald-soft dark:hover:bg-white/10"
          aria-label={t('nextAyah')}
        >
          <SkipForward className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate text-sm font-semibold text-ink dark:text-white">
            {t('surah')} {surahNumber}
            {playingAyah ? ` · ${t('ayah')} ${playingAyah}` : ''}
          </p>
          <p className="truncate text-xs text-ink-soft dark:text-white/55">{reciterName}</p>
          {audioError && <p className="truncate text-xs text-red-600">{audioError}</p>}
          {loadingAudio && <p className="text-xs text-ink-soft dark:text-white/55">{t('loading')}</p>}
        </div>
        <button
          type="button"
          onClick={() => setRepeatAyah((v) => !v)}
          className={`rounded-full p-2 transition ${repeatAyah ? 'bg-emerald-brand text-white' : 'text-emerald-brand hover:bg-emerald-soft dark:hover:bg-white/10'}`}
          aria-label={t('repeatAyah')}
          title={t('repeatAyah')}
        >
          <Repeat1 className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setRepeatSurah((v) => !v)}
          className={`rounded-full p-2 transition ${repeatSurah ? 'bg-emerald-brand text-white' : 'text-emerald-brand hover:bg-emerald-soft dark:hover:bg-white/10'}`}
          aria-label={t('repeatSurah')}
          title={t('repeatSurah')}
        >
          <Repeat className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => updateSettings({ volume: settings.volume === 0 ? 0.9 : 0 })}
            className="rounded-full p-2 text-emerald-brand transition hover:bg-emerald-soft dark:hover:bg-white/10"
            aria-label={t('volume')}
          >
            {settings.volume === 0 ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
            className="w-20 cursor-pointer"
            aria-label={t('volume')}
          />
        </div>
        <select
          value={settings.speed}
          onChange={(e) => updateSettings({ speed: Number(e.target.value) })}
          className="rounded-full border border-black/10 bg-white px-2 py-1.5 text-xs font-semibold text-emerald-brand dark:border-white/15 dark:bg-white/5"
          aria-label={t('speed')}
        >
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
            <option key={s} value={s}>{s}x</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-ink-soft transition hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
          aria-label="Close player"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-black/5 pt-2 dark:border-white/10">
        <label htmlFor="reciter-select" className="text-xs font-semibold text-ink-soft dark:text-white/60">
          {t('reciter')}:
        </label>
        <select
          id="reciter-select"
          value={settings.reciter}
          onChange={(e) => updateSettings({ reciter: e.target.value })}
          className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-white/5"
        >
          {RECITERS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.style})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
