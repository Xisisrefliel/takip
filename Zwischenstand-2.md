2. Zwischenstand – Projektdokumentation  
Filme, Serien & Bücher Tracker (Web-App)  
Ömer Faruk Gül — Stand: 10.12.2025

---

## Inhaltsverzeichnis
1. Projektidee & Nutzen
2. Technischer Überblick (Ist-Stack)
3. Fortschritt seit dem 1. Zwischenstand
4. Aktueller Funktionsumfang
5. Architektur & Datenhaltung
6. UI/UX-Status
7. Offene Arbeiten & nächste Schritte
8. Quellen

---

## 1. Projektidee & Nutzen
Zentrale Web-App, die Filme, Serien und Bücher zusammenführt. Nutzer:innen können entdecken, Verfügbarkeiten prüfen, eigene Watchlists/Leselisten pflegen, Fortschritt markieren, bewerten und Empfehlungen ableiten – alles an einem Ort.

## 2. Technischer Überblick (Ist-Stack)
- Next.js (App Router) als Fullstack-Framework
- Auth: NextAuth (Credentials), Session-basiert
- Datenbank: PostgreSQL via Drizzle ORM & Migrations
- Externe Datenquellen: TMDB (Filme/Serien), Hardcover API (Bücher)
- Styling/Motion: Tailwind CSS, Framer Motion, Icons via Lucide
- Hosting-Ziel: Vercel-kompatibel (SSR/ISR)

## 3. Fortschritt seit dem 1. Zwischenstand
- Stack-Wechsel von Laravel/Inertia/Vue zu Next.js App Router mit server actions → weniger Overhead, bessere SSR-Integration.
- Vollständige Authentifizierung implementiert (Signup/Login/Logout) inkl. Sessions.
- Watchlist/Favoriten/Gesehen-Status persistent in PostgreSQL für Filme, Serien und Bücher.
- Episoden-Tracking je Staffel (Einzel-Episode & ganze Staffel als gesehen markieren).
- Reviews mit 1–5 Sternen + Text, pro Media oder Episode, inkl. Änderungs- und Löschfunktion.
- Regionale Verfügbarkeiten steuerbar (Preferred Region) und in UI berücksichtigt.
- Profilbereich mit Filterung nach Tabs (Watched/Watchlist/Favorites) und Content-Typ (Movies/TV/Books).
- Startseite zieht Trending Movies & Popular Series, angereichert mit User-Status.

## 4. Aktueller Funktionsumfang
- **Suche & Entdecken:** TMDB-Suche (Filme/Serien) und Hardcover-Suche (Bücher), Detailseiten mit Cast/Seasons/Providern.  
- **Watchlist & Status:** Toggle für Watchlist/Liked/Gesehen; Episoden-Status pro Folge, Staffel-als-gesehen Batch.  
- **Bewertungen:** Sternebewertung + Kommentar, Edit/Delete, Anzeige aller Reviews zu Media oder Episode.  
- **Regionen:** Nutzerpräferenz für Region speicherbar; beeinflusst Streaming-Provider-Anzeige.  
- **Profile Library:** Tab- und Filter-UI, Animationen, Counts für watched/watchlist/favorites, getrennt für Movies/TV/Books.  
- **Books-Integration:** Gleiches Status-System (gelesen, merken, mögen) mit Hardcover-Daten.  
- **UX:** Motion-basierte Grid-Transitions, Responsive Cards (MovieCard/BookCard), Sticky Controls.

## 5. Architektur & Datenhaltung
- **Server Actions & Caching:** Actions für Auth, Status-Toggles, Reviews; `revalidatePath` für Home/Profile.  
- **Datenmodell (Drizzle, PostgreSQL):**  
  - `users` (inkl. preferredRegion)  
  - `userMovies` (mediaType movie/tv, watched/liked/watchlist, watchedDate)  
  - `userBooks` (watched/readDate, liked, watchlist)  
  - `userEpisodes` (episodeId, watched, watchedDate)  
  - `reviews` (rating, text, mediaId/mediaType oder episodeId)  
- **APIs:** TMDB/Hardcover Fetching + Enrichment mit Nutzungsstatus.

## 6. UI/UX-Status
- Hero/Home: Trending Movies + Popular Series mit User-Badges.  
- Detailseiten: Poster, Trailer/Backdrop, Cast, Seasons, Watch-Providers, Reviews.  
- Profil: Interaktive Tabs/Filter, Content-Typ-Switch, leer-Zustände mit Hinweisen.  
- Auth-Flows: Login/Signup Seiten, Redirects nach Erfolg, Fehlerfeedback.  
- Theme: Gradients, glasige Surfaces, Mikroanimationen für Hover/Tab-Wechsel.

## 7. Offene Arbeiten & nächste Schritte
- Push-Notifications oder E-Mail-Alerts für neue Folgen in der Watchlist.
- Recommendation-Section (basierend auf Likes/Watch-History).
- Progress-Visualisierung (Timeline/Charts) im Profil.
- Accessibility-Härtung (Focus States, ARIA für Motion-Controls).
- Testabdeckung (server actions, UI states) und Load-Tests für TMDB/Hardcover Calls.
- Deployment-Setup (Vercel + env management), Seed-Skripte für Demo-User.

## 8. Quellen
- TMDB API: https://developer.themoviedb.org/docs  
- Hardcover API: https://hardcover.app  
- Next.js: https://nextjs.org/docs  
- NextAuth: https://next-auth.js.org/  
- Drizzle ORM: https://orm.drizzle.team/  
- Tailwind CSS: https://tailwindcss.com/docs  
