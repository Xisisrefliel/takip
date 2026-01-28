---
marp: true
theme: default
class: invert
paginate: true
backgroundColor: #09090b
color: #d4d4d8
style: |
  section {
    font-family: 'Inter', system-ui, sans-serif;
    background: #09090b;
    padding: 60px;
  }
  h1 {
    font-size: 3.5em;
    font-weight: 800;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.03em;
    text-align: center;
  }
  h2 {
    font-size: 2em;
    font-weight: 700;
    color: #fafafa;
    letter-spacing: -0.02em;
    margin-bottom: 0.6em;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 0.3em;
  }
  h3 {
    font-size: 1.2em;
    font-weight: 600;
    color: #3b82f6;
  }
  p, li {
    color: #d4d4d8;
    line-height: 1.6;
  }
  ul, ol {
    margin-left: 0;
  }
  li {
    margin-bottom: 0.4em;
  }
  code {
    background: rgba(59, 130, 246, 0.2);
    padding: 0.15em 0.4em;
    border-radius: 6px;
    color: #3b82f6;
    font-size: 0.9em;
  }
  table {
    margin: 0 auto;
    border-collapse: collapse;
    font-size: 0.85em;
  }
  th {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    padding: 0.6em 1.2em;
    font-weight: 600;
    text-align: left;
  }
  td {
    background: rgba(39, 39, 42, 0.5);
    padding: 0.5em 1.2em;
    border-top: 1px solid rgba(63, 63, 70, 0.3);
  }
  .blue { color: #3b82f6; }
  .purple { color: #8b5cf6; }
  .green { color: #22c55e; }
  .yellow { color: #eab308; }
  .muted { color: #71717a; }
  .center { text-align: center; }
  pre {
    background: rgba(24, 24, 27, 0.8);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    padding: 1em;
    font-size: 0.65em;
  }
  blockquote {
    background: rgba(39, 39, 42, 0.6);
    border-left: 4px solid #3b82f6;
    border-radius: 0 12px 12px 0;
    padding: 0.8em 1.2em;
    margin: 1em 0;
    font-size: 0.9em;
  }
  img {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  footer {
    color: #52525b;
    font-size: 0.7em;
  }
---

<!-- _class: invert -->
<!-- _paginate: false -->

# Takip

**Die intelligente Media-Tracking App**

![w:140](https://image.tmdb.org/t/p/w200/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg) ![w:140](https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg) ![w:160](https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg) ![w:140](https://image.tmdb.org/t/p/w200/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg) ![w:140](https://image.tmdb.org/t/p/w200/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg)

<span class="muted">Omer | Januar 2026</span>

---

## Gliederung

<div style="max-width: 600px; margin: 0 auto; font-size: 1.1em;">

1. Motivation & Problemstellung
2. Lösung: Takip Kernfunktionen
3. Feature Highlights
4. Technische Architektur
5. Tech Stack & Datenbank
6. Live Demo
7. Zusammenfassung & Ausblick

</div>

---

## Motivation & Problemstellung

### Das Problem

- <span class="yellow">**Streaming-Überfluss:**</span> Netflix, Prime, Disney+, Apple TV+...
- "Was habe ich schon gesehen?"
- "Wo kann ich das streamen?"
- Keine zentrale Übersicht
- Empfehlungen nur plattformbasiert

> <span class="blue">**Die Frage:**</span> Wie behalte ich den Überblick über mein Entertainment?

---

## Lösung: Takip Kernfunktionen

| <span class="blue">**Tracking**</span> | <span class="blue">**Streaming**</span> | <span class="blue">**Entdecken**</span> | <span class="blue">**Bewertungen**</span> |
|:--|:--|:--|:--|
| ✓ Gesehen markieren | ✓ Verfügbarkeit prüfen | ✓ Trending Inhalte | ✓ 1-5 Sterne Rating |
| ✓ Watchlist führen | ✓ 140+ Regionen | ✓ Neu im Kino | ✓ Text-Reviews |
| ✓ Favoriten speichern | ✓ Direktlinks | ✓ Filter & Suche | ✓ Historie |

![w:100](https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg) ![w:100](https://image.tmdb.org/t/p/w200/8kNruSfhk5IoE4eZOc4UpvDn6tq.jpg) ![w:100](https://image.tmdb.org/t/p/w200/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg) ![w:100](https://image.tmdb.org/t/p/w200/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg)

---

## Feature: Hidden Gems & Discovery

### <span class="purple">Hidden Gems Algorithmus</span>

- <span class="green">**Kritisch gelobt:**</span> Rating 7-9
- <span class="purple">**Wenig bekannt:**</span> 100-1000 Votes
- Qualität abseits des Mainstreams

### <span class="blue">Erweiterte Suche</span>

- Multi-Filter: Genre, Rating, Laufzeit
- Streaming nach Region
- Sortierung nach Beliebtheit

> <span class="blue">**Beispiel:**</span> Italienische Thriller aus den 70ern auf MUBI mit Rating ≥ 7.5

---

## Feature: Persönliche Statistiken

### "Cinematic Fingerprint"

| Metrik | Beschreibung |
|:--|:--|
| ⏱️ Gesamtstunden | Alle geschauten Stunden |
| 📊 Genre-Verteilung | Dein Geschmacksprofil |
| 📅 Filme nach Jahr | Timeline deiner Watches |
| 🎭 Dekaden-Affinität | 80er, 90er, 2000er...? |
| 👥 Top Cast & Crew | Lieblingsschauspieler |
| ⭐ Rating-Verteilung | Dein Bewertungsmuster |

**247** Filme  •  **412h** Gesamtzeit  •  <span class="green">Drama 34%</span>  •  <span class="yellow">Thriller 28%</span>  •  <span class="purple">Sci-Fi 18%</span>

---

## Feature: TV-Serien Tracking

### 📺 Episoden-Tracking

| Feature | Beschreibung |
|:--|:--|
| ✓ Einzelne Episoden markieren | Jede Episode einzeln tracken |
| ✓ Staffel-Übersicht | Alle Staffeln auf einen Blick |
| ✓ Fortschrittsanzeige | Visueller Progress |
| ✓ Reviews pro Episode | Bewertung einzelner Folgen |
| ✓ Nächste Episode finden | Continue Watching |
| ✓ Serien-Statistiken | Gesamtfortschritt |

**Breaking Bad** ████████████████████░░░░░░ **47/62** <span class="green">75%</span>

---

## Technische Architektur

```
┌─────────────────────────────────────────────────────────┐
│                       FRONTEND                          │
│           Next.js 16 (App Router) + React 19            │
│              Tailwind CSS + Framer Motion               │
├─────────────────────────────────────────────────────────┤
│                    SERVER ACTIONS                       │
│             (Mutations, Auth, API Calls)                │
├───────────────────────────┬─────────────────────────────┤
│    PostgreSQL (Neon)      │       External APIs         │
│       Drizzle ORM         │     TMDB, Hardcover         │
└───────────────────────────┴─────────────────────────────┘
```

**Caching:** Trending: 1h • Discovery: 4h • Details: 24h • Metadaten gecached

---

## Tech Stack

| Kategorie | Technologie |
|:--|:--|
| ⚡ Runtime | <span class="blue">**Bun**</span> |
| 🖼️ Framework | <span class="blue">**Next.js 16**</span> + React 19 |
| 🗄️ Datenbank | PostgreSQL (<span class="purple">Neon Serverless</span>) |
| 📦 ORM | <span class="blue">**Drizzle ORM**</span> |
| 🔐 Auth | NextAuth v5 (JWT) |
| 🎨 Styling | Tailwind CSS v4 |
| ✨ Animation | <span class="purple">Framer Motion</span> |
| 🔌 APIs | TMDB, Hardcover GraphQL |

---

## Datenbank Schema

### Kern-Tabellen

| Tabelle | Beschreibung |
|:--|:--|
| `users` | Benutzer + Präferenzen |
| `userMovies` | Film/Serien-Tracking |
| `userBooks` | Bücher-Tracking |
| `userEpisodes` | Einzelne Episoden |
| `reviews` | Bewertungen (1-5 ⭐) |
| `userStats` | Statistiken (JSONB) |

### Performance

<span class="green">**Indizes**</span> auf häufige Queries • <span class="blue">**JSONB**</span> für flexible Analytics • <span class="purple">**Batch-Ops**</span> gegen N+1

---

## API Integrationen

### 🎬 TMDB

- ✓ Filme & Serien Daten
- ✓ Cast, Crew, Keywords
- ✓ Streaming-Verfügbarkeit
- ✓ Empfehlungen

### 📚 Hardcover

- ✓ Bücher via GraphQL
- ✓ Autoren & Cover
- ✓ Beschreibungen

> <span class="blue">**Smart Caching:**</span> Metadaten einmal abrufen → in DB speichern → API-Calls reduziert

---

## Zusammenfassung & Ausblick

### <span class="green">✓ Was Takip bietet</span>

- Zentrale Übersicht für alle Medien
- Intelligente Entdeckung
- Persönliche Statistiken
- Multi-Region Streaming-Finder

### <span class="purple">🚀 Ausblick</span>

- 📱 Mobile App
- 👥 Social Features
- 🧠 AI-basierte Empfehlungen
- 🎵 Spotify Integration

---

<!-- _class: invert -->
<!-- _paginate: false -->

# <span class="blue">Fragen?</span>

<div style="text-align: center; margin-top: 2em;">

**Vielen Dank für Ihre Aufmerksamkeit!**

</div>

![w:120](https://image.tmdb.org/t/p/w200/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg) ![w:120](https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg) ![w:120](https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg) ![w:120](https://image.tmdb.org/t/p/w200/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg) ![w:120](https://image.tmdb.org/t/p/w200/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg)

<span class="muted">Omer | Januar 2026</span>
