# Al-Quran — Read, Listen & Reflect

A premium, fully functional Quran reading web application. Read all 114 surahs
with Arabic text, Bangla and English translations, listen to world-renowned
reciters, search the Quran, and track your reading progress — all in the browser.

> **Scope note:** this is the **website** phase only. PWA install support,
> service worker and offline reading are intentionally out of scope for now
> and are not claimed anywhere in the app.

## Features

- **Home** — Bismillah header, Today's Ayah (deterministic by date, real ayah
  from the API), Continue Reading, Last Read, reading progress (ayahs read /
  6236), daily reading goal, stats (114 surahs / 6236 ayahs), Featured Surah
  of the day, quick access chips.
- **Reader** — all 114 surahs. Arabic (Uthmani) + Bangla + English, switchable
  reading modes (Arabic Only / +Bangla / +English / +Both), Arabic & translation
  font-size controls, per-ayah numbers, Juz badge, click an ayah to mark it
  read, bookmark / favorite / copy per ayah, prev/next surah navigation,
  fullscreen reading mode. Surah 9 (At-Tawbah) correctly shows no Bismillah;
  Surah 1 ayah 1 (the Bismillah) is rendered as a normal numbered ayah; for
  surahs 2–114 the Bismillah prepended by the API is stripped from ayah 1 and
  shown as a separate unnumbered header.
- **Audio player** — full-surah playback (ayahs played sequentially), per-ayah
  play, play/pause, next/previous ayah, repeat ayah, repeat surah, progress
  bar, volume, playback speed (0.5x–2x), 10 reciters, currently-playing ayah
  highlighted in the reader.
- **Search** — surah name (Arabic/English/transliteration) & number (client
  side), direct `surah:ayah` references (e.g. `2:255`), and full-text search
  in Arabic, English or Bangla via the API. Results jump straight to the
  surah and scroll to / highlight the ayah.
- **Dashboard** — last read, continue reading, reading history, bookmarks,
  favorite ayahs, daily progress vs goal, total ayahs read, completed surahs.
  Everything persists in `localStorage`; the store is structured so a future
  user-account / cloud-sync layer can replace the local persistence.
- **Surah & Juz navigation** — all 114 surahs with Arabic name, English name,
  ayah count and Meccan/Medinan info (filterable); all 30 Juz, each opening
  its ayahs grouped by surah with direct links into the reader.
- **Extras** — dark / light mode (persisted), Bangla / English UI (full
  string dictionary, both working), reading goal (settable), reading history,
  responsive mobile / tablet / desktop layout with mobile bottom navigation,
  loading skeletons, error states with retry, empty states, accessible labels,
  SEO meta tags.

## Tech stack

- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- lucide-react icons (no emoji in the UI)
- Google Fonts: Amiri Quran / Scheherazade New (Quran text), Noto Naskh Arabic
  (Arabic UI), Hind Siliguri (Bangla), Inter (Latin UI)
- No backend. State in React + `localStorage`.

## Data sources (all verified, no invented text)

All Quran text, translations and audio come from **AlQuran Cloud**
(https://api.alquran.cloud/v1) — free, no API key required. No secrets are
used or stored anywhere.

- Arabic text: `quran-uthmani`
- Bangla translation: `bn.bengali` — **Muhiuddin Khan** (default); `bn.hoque` —
  **Zohurul Hoque** (selectable in reader settings)
- English translation: `en.sahih` — **Saheeh International**
- Audio: `ar.alafasy`, `ar.abdulbasitmurattal`, `ar.husary`, `ar.minshawi`,
  `ar.minshawimujawwad`, `ar.mahermuaiqly`, `ar.abdurrahmaansudais`,
  `ar.saoodshuraym`, `ar.hanirifai`, `ar.shaatree` (all verified live)

Translator credits are shown in the reader and in the footer.

## Run it

```bash
npm install
npm run dev      # development server
npm run build    # production build (tsc + vite) -> dist/
npm run preview  # serve the production build locally
```

## Project structure

```
src/
  lib/
    api.ts      # AlQuran Cloud client, Bismillah handling, reciters, helpers
    i18n.ts     # Bangla / English UI strings
    store.tsx   # settings + reading progress (localStorage-backed)
  components/
    ui.tsx          # skeletons, error box, surah card, progress bar
    AudioPlayer.tsx # full audio player
    Reader.tsx      # surah reading view
    Home.tsx        # homepage
    SurahList.tsx   # surah list + Juz browser
    SearchView.tsx  # search
    Dashboard.tsx   # personal dashboard
  App.tsx       # navigation + view routing + footer
  index.css     # Tailwind v4 theme (green / cream / gold), fonts, animations
```

## Known limitations (this phase)

- PWA install / service worker / offline reading: out of scope, not implemented.
- No user accounts or cloud sync yet — progress lives in the browser's
  `localStorage` (architecture is ready for a future sync layer).
- Audio needs an internet connection (streams MP3s from the AlQuran Cloud CDN).
