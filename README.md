# Karthik & Meenakshi — Wedding Invitation

A premium, cinematic **South Indian wedding invitation website** with a traditional
temple aesthetic. Deep maroon velvet, antique gold, warm ivory, scroll-driven 3D
temple doors, floating golden dust and petals, and live ceremonial ambience.

---

## Experience Highlights

- **Temple Door Opening** — engraved twin doors swing open in 3D, synchronized to scroll
- **Cinematic Hero** — parallax couple portrait, gradient-gold names, ornamental frame
- **Our Story** — editorial bride & groom portrait cards
- **Wedding Details** — Muhurtham, Reception & Venue cards with Google Maps links
- **Events Timeline** — five ceremonies on a golden thread with scroll reveals
- **Gallery** — bento grid with a full lightbox (keyboard supported)
- **Invitation Message** — framed blessing with a glowing halo
- **Countdown** — live countdown to the Muhurtham with fluid digit transitions
- **Venue** — tinted Google Map embed + Get Directions
- **Finale** — temple-pillar backdrop, blessing, developer credit footer
- **Sacred Ambience** — tanpura-style drone + veena plucks (Raga Hamsadhvani)
  generated live with WebAudio; begins on first interaction
- **Ambient Effects** — canvas golden dust and falling petals, film grain, vignette
- Fully responsive, `prefers-reduced-motion` aware, accessible controls

---

## Tech Stack

| Layer      | Tools                                                |
| ---------- | ---------------------------------------------------- |
| Framework  | React 19 + TypeScript                                |
| Build      | Vite 7 (single-file output via `vite-plugin-singlefile`) |
| Styling    | Tailwind CSS 4 (`@theme` tokens) + custom CSS        |
| Animation  | Framer Motion (scroll-driven transforms, reveals)    |
| Icons      | Lucide React                                         |
| Audio      | WebAudio API (generated ambience — no audio files)   |

---

## Getting Started

### Requirements

- **Node.js 18+** and npm

### Install packages

```bash
npm install
```

This installs every dependency declared in `package.json`:

**Runtime**

| Package         | Purpose                                |
| --------------- | -------------------------------------- |
| `react` / `react-dom` | UI framework                       |
| `framer-motion` | Scroll-synced doors, reveals, gestures |
| `lucide-react`  | Icons                                  |
| `clsx`, `tailwind-merge` | Class-name utilities           |

**Dev / Build**

| Package               | Purpose                          |
| --------------------- | -------------------------------- |
| `vite`, `@vitejs/plugin-react` | Build tooling         |
| `tailwindcss`, `@tailwindcss/vite` | CSS engine           |
| `vite-plugin-singlefile` | Inlines JS/CSS into one HTML file |
| `typescript`          | Type checking                    |

To add the animation/icon packages manually (fresh clone, for example):

```bash
npm install framer-motion lucide-react
```

### Run the development server

```bash
npm run dev
```

Opens the site at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Outputs to `dist/`:

- `dist/index.html` — the app with all JS/CSS inlined
- `dist/images/`   — the wedding photography

### Preview the production build

```bash
npm run preview
```

---

## Customization

### 1. Wedding content → `src/data.ts`

Everything is editable in one file:

| Field                    | What it controls                                  |
| ------------------------ | ------------------------------------------------- |
| `wedding.groom` / `wedding.bride` | Names, parents, short bios           |
| `wedding.dateISO`        | The exact Muhurtham moment — **drives the countdown** |
| `wedding.dateDisplay` / `dateLong` / `muhurtham` | Human-readable date strings |
| `wedding.venue`          | Name, address, Google Maps URL + embed link       |
| `wedding.message` / `blessing` | Invitation quote + closing blessing     |
| `events[]`               | Timeline ceremonies (icon, title, date, venue, description) |
| `gallery[]`              | Gallery images, captions, layout spans            |
| `wedding.developer`      | Footer credit + portfolio link                    |

### 2. Photography → `public/images/`

Replace any `.jpg` keeping the **same filenames** —
`couple-hero.jpg`, `bride.jpg`, `groom.jpg`, `gallery-*.jpg`, `temple-pillars.jpg`.
Recommended: ≥1600px wide, richly graded in maroon/gold tones.

### 3. Colors & fonts → `src/index.css`

Adjust the `@theme` tokens (`--color-maroon-*`, `--color-gold-*`, `--color-ivory-*`,
`--color-forest-*`) to re-grade the whole site. Font families map to
`--font-display`, `--font-body`, `--font-caps`, `--font-script`, `--font-engraved`
(loaded in `index.html` via Google Fonts).

### 4. Door opening feel → `src/components/TempleOpening.tsx`

- Scroll length: `style={{ height: "260vh" }}`
- Swing amount: `rotate` transform range (`0 → ±101` degrees)
- Fully-open point: `[0, 0.62]` progress window

### 5. Music → `src/components/AudioAmbience.tsx`

- `SCALE` — raga note pool (MIDI numbers)
- `0.55` — master volume ramp target in `start()`
- Phrase pacing: `3.2 + Math.random() * 3.6` seconds between phrases

---

## Project Structure

```
├── index.html                  # fonts, meta, title
├── public/
│   └── images/                 # wedding photography (replace freely)
├── src/
│   ├── App.tsx                 # page composition
│   ├── main.tsx
│   ├── index.css               # Tailwind v4 theme, velvet/gold system
│   ├── data.ts                 # ★ EDIT ME — all wedding content
│   └── components/
│       ├── TempleOpening.tsx   # cinematic 3D temple doors (scroll-driven)
│       ├── Hero.tsx            # the revealed invitation
│       ├── CoupleSection.tsx   # bride & groom portrait cards
│       ├── DetailsSection.tsx  # muhurtham / reception / venue cards
│       ├── TimelineSection.tsx # five ceremonies on a golden thread
│       ├── GallerySection.tsx  # bento grid + lightbox
│       ├── MessageSection.tsx  # framed invitation message
│       ├── CountdownSection.tsx# live countdown
│       ├── VenueSection.tsx    # map + directions
│       ├── FinalSection.tsx    # blessing + footer credit
│       ├── Effects.tsx         # golden dust + petals canvas
│       ├── AudioAmbience.tsx   # WebAudio raga ambience
│       ├── Ornaments.tsx       # lotus, mandala, seals, frames (SVG)
│       └── Reveal.tsx          # scroll-reveal utilities
└── dist/                       # production build
```

---

## Accessibility & Performance

- `prefers-reduced-motion`: doors fade instead of swinging, canvas effects disabled
- Semantic sections with labels, keyboard-operable lightbox and controls
- Scroll-tied transforms only (GPU-friendly); image lightbox pauses page scroll
- No horizontal overflow; responsive from 320px phones to wide desktops
- External runtime dependencies: Google Fonts only

---

*Developed by [Hariharasudhan](https://hariharasudhan-portfolio-iota.vercel.app)*
