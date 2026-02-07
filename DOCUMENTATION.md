# Projektdokumentation: Takip – Media Tracking Application

---

## 1 Ausgangssituation

### 1.1 Projektidee

Bestehende Plattformen wie Letterboxd oder IMDb bieten zwar Teilfunktionen zur Verwaltung konsumierter Medieninhalte, jedoch fehlt eine einheitliche Lösung, die Filme, Serien und Bücher in einer modernen Webanwendung zusammenführt. Die Idee des Schulprojekts ist es, eine Full-Stack-Webanwendung zu entwickeln, mit der Nutzer ihre Medienbibliothek digital verwalten, bewerten und personalisierte Empfehlungen erhalten können. Der Name "Takip" stammt aus dem Türkischen und bedeutet "Verfolgung" beziehungsweise "Nachverfolgung", was den Kernzweck der Anwendung beschreibt.

Das Anwendungsfalldiagramm, welches im Anhang unter Punkt 8.1 Anwendungsfalldiagramm zu finden ist, zeigt die zentralen Use Cases der Anwendung und visualisiert die folgenden Abläufe. Der Nutzer kann über die Suchfunktion Medieninhalte finden und diese als gesehen, gemerkt oder favorisiert markieren. Die Discover-Seite ermöglicht eine gefilterte Medienentdeckung über die TMDB-API. Das Empfehlungssystem generiert als Akteur automatisch personalisierte Vorschläge auf Basis der bisherigen Bewertungen und Vorlieben. Über die Statistikseite werden aggregierte Daten zu den Sehgewohnheiten visualisiert. Bewertungen mit einer Fünf-Sterne-Skala und optionalem Freitextkommentar können vom Nutzer abgegeben werden. Die Verwaltung der Benutzerkonten erfolgt über eine E-Mail- und Passwort-basierte Authentifizierung.

## 2 Projektbeschreibung

### 2.1 Zielsetzung

Das Ziel des Projekts war es, innerhalb von 50 Schulstunden, bis zum Abgabetag, eine funktionsfähige Webanwendung zu entwickeln. Diese soll es Nutzern ermöglichen, Filme, Serien und Bücher als "gesehen", "gemerkt" oder "favorisiert" zu markieren und diese Informationen in einem persönlichen Profil zusammenzufassen. Darüber hinaus wurde ein Bewertungssystem mit einer Fünf-Sterne-Skala implementiert, über das Nutzer ihre Meinung zu einzelnen Titeln festhalten können. Ein weiteres Ziel war die Integration eines Empfehlungssystems, das auf Grundlage der bisherigen Bewertungen personalisierte Vorschläge in drei Kategorien generiert. Die Benutzeroberfläche sollte modern, responsiv und visuell ansprechend gestaltet werden, um sich bewusst von generischen Standarddesigns abzuheben. Schließlich sollte die Anwendung eine Statistikseite bieten, die dem Nutzer aggregierte Daten über seine Sehgewohnheiten in Form von Diagrammen und Kennzahlen darstellt. Unter dem Punkt 6.1 Soll-Ist-Vergleich wird detailliert auf die Umsetzung der einzelnen Anforderungen eingegangen.

## 3 Projektplanung

### 3.1 Projektmanagement

Das Projekt wurde inkrementell umgesetzt. Zunächst wurde eine Anforderungsanalyse durchgeführt, in der die Kernfunktionalitäten definiert wurden: Nutzerverwaltung mit Registrierung und Anmeldung, Medienverwaltung mit Such- und Filterfunktionen, Bewertungssystem sowie Statistikauswertung. Anschließend wurde die technische Architektur festgelegt und die Auswahl der Frameworks und Bibliotheken getroffen. Die Entwicklung folgte einem schrittweisen Ansatz, bei dem zunächst die Datenbankstruktur und Authentifizierung implementiert wurden, bevor die einzelnen Feature-Bereiche hinzugefügt wurden. Für die Versionsverwaltung wurde Git eingesetzt, wodurch alle Änderungen nachvollziehbar dokumentiert und bei Bedarf rückgängig gemacht werden konnten. Unter dem Punkt 6.1 Soll-Ist-Vergleich wird noch detaillierter auf die verbrauchte Zeit eingegangen. Und unter 8.2 Tabellarische Auflistung der Phasen inkl. Soll-Ist-Vergleich wird alles genau aufgelistet.

### 3.2 Technologien

Als Framework kam Next.js in der Version 16 zum Einsatz, das auf React 19 aufbaute und den App Router für dateibasiertes Routing verwendete. Die Laufzeitumgebung wurde mit Bun realisiert, einer schnellen JavaScript-Runtime als Alternative zu Node.js. Für die Datenbank wurde PostgreSQL über den Serverless-Dienst Neon eingesetzt, der eine skalierbare Datenbankanbindung über HTTP ermöglichte. Als ORM kam Drizzle ORM (Version 0.44.7) zum Einsatz, das typsichere Datenbankabfragen in TypeScript erlaubte und automatisch Migrationen generierte. Die Authentifizierung wurde mit NextAuth v5 (Auth.js, Version 5.0.0-beta.30) umgesetzt. Das Styling erfolgte mit Tailwind CSS v4, ergänzt durch Framer Motion für Animationen. Für die externen Mediendaten wurden die TMDB-REST-API (Filme und Serien) sowie die Hardcover-GraphQL-API (Bücher) integriert. Die Diagramme auf der Statistikseite wurden mit Recharts realisiert. Zur Speicherung sensibler Zugangsdaten wie dem TMDB-API-Key, dem AUTH_SECRET und dem DATABASE_URL wurde eine .env-Konfigurationsdatei erstellt.

### 3.3 Methoden und Artefakte

Die Projektdokumentation wurde durch verschiedene UML-Diagramme ergänzt, die den Systemaufbau und die Prozessabläufe visualisieren.

#### 3.3.1 Klassendiagramm

Das Klassendiagramm, hinterlegt im Anhang unter 8.3 Klassendiagramm, bildet die zentrale Datenstruktur der Anwendung ab. Die Klasse "User" stellt den Benutzer dar mit Attributen wie id, email, hashedPassword und preferredRegion. Mit der Klasse "UserMovie" wird die Beziehung zwischen einem Nutzer und einem Film beziehungsweise einer Serie modelliert, wobei neben den Statusfeldern watched, liked und watchlist auch zwischengespeicherte Metadaten wie title, year, runtime, genres, cast und crew enthalten sind. Die Klasse "Review" bildet das Bewertungssystem ab und enthält eine Sternebewertung (rating: 1–5) sowie einen optionalen Freitextkommentar (content). Die Klasse "UserStats" speichert aggregierte Statistikdaten in JSONB-Spalten, darunter die Gesamtanzahl geschauter Filme, die Verteilung nach Genres und Jahrzehnten sowie die beliebtesten Schauspieler und Regisseure. Eine weitere Klasse "UserRecommendations" enthält vorberechnete Empfehlungslisten, unterteilt in die Kategorien "Personalisiert", "Erkundung" und "Geheimtipps". Die Methoden der Hauptklassen werden über Server Actions in der Datei actions.ts bereitgestellt, darunter toggleWatchedAction(), toggleWatchlistAction(), toggleLikedAction() und createReviewAction().

![Klassendiagramm](diagrams/klassendiagramm.png)

*Abbildung 1: Klassendiagramm der zentralen Datenmodelle*

#### 3.3.2 Sequenzdiagramm

Das Sequenzdiagramm, dargestellt im Anhang unter 8.4 Sequenzdiagramm, beschreibt den Ablauf, wenn ein Nutzer einen Film als "gesehen" markiert. Der Nutzer klickt auf die entsprechende Schaltfläche in der UI-Komponente. Diese ruft die Server Action toggleWatchedAction() auf, die zunächst die aktuelle Sitzung über auth() aus NextAuth überprüft. Nach erfolgreicher Autorisierung wird geprüft, ob bereits ein Eintrag in der Tabelle user_movies existiert. Falls ja, wird der watched-Status per Update umgeschaltet. Falls nein, werden die Metadaten des Films über fetchTMDB() von der TMDB-API abgerufen und ein neuer Datenbankeintrag erstellt. Anschließend wird der Statistik-Cache in der Tabelle user_stats invalidiert und der Profil-Pfad über revalidatePath() revalidiert, sodass die Änderung sofort sichtbar wird. Dieser gesamte Ablauf gibt eine Erfolgs- oder Fehlermeldung an die UI-Komponente zurück.

![Sequenzdiagramm](diagrams/sequenzdiagramm.png)

*Abbildung 2: Sequenzdiagramm -- Film als gesehen markieren*

#### 3.3.3 Aktivitätsdiagramm

Das Aktivitätsdiagramm, im Anhang unter 8.5 Aktivitätsdiagramm, beschreibt den Prozess der Medien-Entdeckung über die Discover-Seite. Der Ablauf beginnt damit, dass der Nutzer die Seite öffnet. Die Filterparameter werden aus der URL extrahiert und auf Gültigkeit geprüft. Falls Filter wie Genre, Streaming-Anbieter, Bewertung oder Laufzeit konfiguriert sind, werden diese in TMDB-kompatible Anfrageparameter umgewandelt. Anschließend wird eine Anfrage an die TMDB-Discovery-API gesendet. Die zurückgegebenen Ergebnisse werden mit dem Nutzerstatus aus der Datenbank angereichert, sodass bei jedem Ergebnis angezeigt wird, ob der Nutzer den Titel bereits gesehen, gemerkt oder favorisiert hat. Die Ergebnisse werden in einem responsiven Raster dargestellt. Über eine "Mehr laden"-Funktion können weitere Seiten nachgeladen werden, wobei die bestehenden Ergebnisse beibehalten werden.

![Aktivitätsdiagramm](diagrams/aktivitaetsdiagramm.png)

*Abbildung 3: Aktivitätsdiagramm -- Medien-Entdeckung*

## 4 Projektdurchführung

### 4.1 Aufbau bzw. Konfiguration

Die Projektstruktur wurde gemäß den Konventionen des Next.js App Router organisiert. Das Verzeichnis src/app enthielt alle Seiten und API-Routen, wobei dynamische Routen über das Muster [mediaType]/[id] realisiert wurden. Die Komponenten befanden sich in src/components, die Datenbankdefinitionen in src/db und die externen API-Clients in src/lib. Für die Konfiguration des Frameworks wurde die Datei next.config.ts angepasst, in der unter anderem der React Compiler aktiviert und die Bildoptimierung mit AVIF- und WebP-Formaten konfiguriert wurde. Die Datenbankverbindung erfolgte über den Neon Serverless HTTP-Client, initialisiert in der Datei src/db/index.ts. Die Drizzle-Konfiguration in drizzle.config.ts verwies auf das Schema in src/db/schema.ts und legte das Migrationsverzeichnis fest.

#### 4.1.1 TMDB-API-Integration

Die initiale Herangehensweise an die TMDB-Integration verwendete einfache fetch-Aufrufe ohne Caching. Bei der Startseite, die parallel Daten für Trending, Popular und Now Playing abruft, führte dies zum HTTP-Statuscode 429 "Too Many Requests", da das TMDB-Rate-Limit von 40 Anfragen pro 10 Sekunden überschritten wurde. Die darauffolgende Fehlermeldung im Terminal lautete "TMDB API rate limit exceeded – retry after 1s". Nach der Analyse wurde ein dedizierter Client mit einer generischen Hilfsfunktion fetchTMDB() implementiert, die ein mehrstufiges Caching über die Next.js-eigene fetch-Option next.revalidate bereitstellte: Trending-Daten eine Stunde (3600s), Suchergebnisse fünf Minuten (300s), Detailseiten 24 Stunden (86400s) und Streaming-Anbieter zwölf Stunden (43200s). Ein weiteres Problem trat bei der Bilddarstellung auf: Die TMDB-API liefert nur relative Pfade wie "/kqjL17yufvn9OVLyXYpvtyrFfak.jpg", die zunächst zu fehlenden Bildern führten, bis die Pfade über vordefinierte Größenkonstanten (IMAGE_SIZES.poster.w500) in vollständige URLs umgewandelt wurden. Zusätzlich mussten die Remote-Bildquellen in der next.config.ts unter images.remotePatterns explizit freigeschaltet werden, da Next.js andernfalls die externe Bildoptimierung mit dem Fehler "Invalid src prop on next/image, hostname is not configured" blockierte.

#### 4.1.2 Authentifizierung mit NextAuth v5

Bei der Integration von NextAuth v5 (Auth.js) trat zunächst das Problem auf, dass die Bibliothek sich in der Version 5.0.0-beta.30 im Beta-Stadium befand und die Dokumentation teilweise unvollständig war. Die anfängliche Konfiguration mit dem Drizzle Adapter führte zur Fehlermeldung "TypeError: Cannot read properties of undefined (reading 'id')", da der JWT-Callback die Benutzer-ID nicht korrekt an die Session weitergab. Die Ursache lag darin, dass in der authorize()-Funktion des Credentials Providers das zurückgegebene Objekt nicht die von NextAuth erwartete Struktur aufwies. Nach mehreren Iterationen wurde die korrekte Konfiguration gefunden, bei der sowohl die jwt- als auch die session-Callbacks angepasst wurden, um die Benutzer-ID und die bevorzugte Region im Token und in der Sitzung verfügbar zu machen. Ein weiterer Stolperstein war die Kompatibilität zwischen dem Drizzle Adapter und dem Credentials Provider: Da der Credentials Provider standardmäßig keine Datenbank-Sessions unterstützt, musste die Sitzungsstrategie explizit auf "jwt" gesetzt werden. Die Passwörter wurden mit bcryptjs mit zehn Hashing-Runden gesichert.

### 4.2 Implementierung

#### 4.2.1 Server Actions und Datenmutationen

Alle Datenmutationen wurden als Server Actions in der Datei src/app/actions.ts implementiert, gekennzeichnet mit der Direktive "use server". Die erste Implementierung der toggleWatchedAction verwendete ein einfaches INSERT in die Tabelle user_movies. Dies führte jedoch zum PostgreSQL-Fehler "duplicate key value violates unique constraint user_movies_user_id_tmdb_id_media_type_unique", wenn ein Nutzer einen bereits markierten Film erneut anklickte. Um dies zu beheben, wurde die Logik auf eine Upsert-Operation mit onConflictDoUpdate() von Drizzle ORM umgestellt, die bei vorhandenen Einträgen ein Update statt eines fehlgeschlagenen Inserts durchführte. Bei jedem Statuswechsel wurden automatisch die Metadaten von der TMDB-API abgerufen und in der Datenbank zwischengespeichert, um wiederholte API-Aufrufe bei der Profilseite zu vermeiden. Nach jeder Mutation wurde der Statistik-Cache invalidiert und der Profil-Pfad mit revalidatePath("/profile") revalidiert.

#### 4.2.2 Empfehlungssystem

Die erste Version des Empfehlungssystems verwendete ausschließlich die TMDB-eigene Recommendations-API, die zu einem gegebenen Film ähnliche Titel vorschlug. Dies führte jedoch zu zwei Problemen: Erstens waren die Vorschläge stark auf den zuletzt geschauten Film beschränkt und boten wenig Variation. Zweitens gab die API für weniger bekannte Titel häufig leere Ergebnisse zurück, was in der Fehlermeldung "Cannot read properties of undefined (reading 'results')" resultierte, da die API-Antwort nicht defensiv geprüft wurde. Stattdessen wurde ein eigener inhaltsbasierter Filteransatz implementiert, der die favorisierten Filme des Nutzers analysiert und die fünf am häufigsten vorkommenden Genres extrahiert. Über die TMDB-Discovery-API werden nun populäre und gut bewertete Titel abgerufen und gegen die bereits gesehenen Inhalte gefiltert. Das System bietet drei Empfehlungskategorien: "Personalisiert" basierend auf Genrepräferenzen, "Erkundung" mit Titeln aus weniger vertrauten Genres und "Geheimtipps" mit Filmen, die einen vote_average über 7.0, aber weniger als 1000 Stimmen aufweisen. Ein weiteres Problem trat bei neuen Nutzern ohne Watchhistory auf (Cold-Start-Problem): Da keine Genrepräferenzen berechnet werden konnten, wurden stattdessen die aktuellen Trending-Titel als Fallback angezeigt. Die vorberechneten Empfehlungen werden in der Tabelle user_recommendations zwischengespeichert und bei Änderungen am Nutzerprofil als veraltet markiert.

#### 4.2.3 Benutzeroberfläche und Hydration

Die Benutzeroberfläche wurde als Kombination aus Server- und Client-Komponenten implementiert. Die Startseite zeigt ein Hero-Banner mit einem zufälligen Trending-Film sowie horizontale Karussells für Kategorien wie Trending, Beliebt und Aktuell im Kino. Die Profilseite bietet drei Tabs für gesehene Filme, die Watchlist und Favoriten. Die Discover-Seite stellt eine umfangreiche Filterfunktion mit acht Filtertypen bereit. Auf mobilen Geräten werden die Filter in einem Drawer-Menü dargestellt. Die Statistikseite verwendet Recharts für die Visualisierung von Daten wie Filme nach Jahr, Genre-Verteilung und Bewertungshistogramm. Bei der Implementierung der interaktiven Komponenten trat zunächst der Fehler "Hydration failed because the initial UI does not match what was rendered on the server" auf. Die Ursache lag darin, dass der Zufallsfilm im Hero-Banner auf dem Server und dem Client unterschiedlich generiert wurde. Dies wurde gelöst, indem die Zufallsauswahl ausschließlich auf dem Server erfolgte und das Ergebnis als Prop an die Client-Komponente übergeben wurde. Für die Animationen mit Framer Motion mussten die animierten Komponenten explizit mit "use client" gekennzeichnet werden, da Framer Motion auf Browser-APIs zugreift, die in Server-Komponenten nicht verfügbar sind.

#### 4.2.4 Datenbankoptimierung

Bei der Profilseite, die alle gesehenen Filme eines Nutzers lädt, traten bei Nutzern mit umfangreicher Watchhistory Ladezeiten von über drei Sekunden auf. Die Analyse mit EXPLAIN ANALYZE zeigte, dass die PostgreSQL-Abfrage einen Sequential Scan über die gesamte Tabelle user_movies durchführte, da kein passender Index vorhanden war. Durch das Anlegen zusammengesetzter Indizes auf die Spaltenkombinationen (userId, watched), (userId, watchlist) und (userId, liked) konnte die Abfrage auf einen Index Scan umgestellt und die Ladezeit auf unter 200 Millisekunden reduziert werden. Ein weiteres Problem betraf die Statistikseite: Die Berechnung der aggregierten Daten (Genre-Verteilung, Jahrzehnt-Verteilung, beliebteste Schauspieler) erforderte bei jedem Seitenaufruf eine aufwändige Auswertung über alle Einträge des Nutzers. Um dies zu optimieren, wurde die Tabelle user_stats mit JSONB-Spalten eingeführt, die die vorberechneten Statistiken zwischenspeichert. Die Invalidierung erfolgt gezielt bei jeder Statusänderung durch Setzen des Feldes updatedAt auf null, woraufhin beim nächsten Abruf eine Neuberechnung stattfindet.

## 5 Test und Optimierung

Während der Entwicklung wurden die Funktionen kontinuierlich manuell getestet. Ein besonderer Schwerpunkt lag auf der korrekten Synchronisation zwischen dem Nutzerstatus in der Datenbank und der Darstellung in der Benutzeroberfläche. Ein konkreter Testfall umfasste das schnelle Klicken auf die "Gesehen"-Schaltfläche, was die bereits beschriebene Race Condition aufdeckte und durch die Upsert-Logik behoben wurde. Ein weiteres Optimierungsfeld betraf die Ladezeiten der Startseite. Durch die parallele Ausführung der API-Aufrufe mit Promise.all() für Trending, Popular und Now Playing sowie die Implementierung des mehrstufigen Caching-Systems konnte die initiale Ladezeit von über vier Sekunden auf unter eine Sekunde reduziert werden. Die Bildoptimierung wurde über die Next.js Image-Komponente mit automatischer Formatkonvertierung zu AVIF und WebP sowie einer 30-tägigen Cache-Dauer (minimumCacheTTL: 2592000) realisiert. Der React Compiler wurde als experimentelles Feature aktiviert, um automatische Memoization zu ermöglichen und unnötige Re-Renders zu vermeiden. Die ESLint-Konfiguration wurde mit den Next.js-spezifischen Regeln eingerichtet und vor jedem Commit ausgeführt, um die Codequalität sicherzustellen. Das Testergebnis bestätigte die zuverlässige Funktionalität der Anwendung und zeigte, dass alle Kernfunktionen korrekt arbeiteten.

## 6 Projektabschluss

### 6.1 Soll-Ist-Vergleich

| Anforderung | Soll | Ist |
|---|---|---|
| Nutzerregistrierung und Anmeldung | E-Mail/Passwort-Authentifizierung | Vollständig implementiert mit NextAuth v5 und bcrypt |
| Filmverwaltung | Gesehen, Watchlist, Favoriten | Vollständig implementiert mit TMDB-Metadaten-Caching |
| Serienverwaltung | Episoden-Tracking | Vollständig implementiert mit Staffel- und Episodenansicht |
| Buchverwaltung | Gelesen, Watchlist, Favoriten | Vollständig implementiert mit Hardcover-API |
| Bewertungssystem | 1–5 Sterne mit Textkommentar | Vollständig implementiert |
| Empfehlungssystem | Personalisierte Vorschläge | Implementiert mit 3 Kategorien |
| Statistik-Dashboard | Diagramme und Kennzahlen | Vollständig implementiert mit Recharts |
| Discover-Funktion | Erweiterte Filteroptionen | Vollständig implementiert mit 8 Filtertypen |
| Responsive Design | Mobile und Desktop | Vollständig responsiv mit Tailwind CSS |
| Datenimport | Letterboxd-CSV-Import | Vollständig implementiert |

Während der Umsetzung ergaben sich leichte Verschiebungen des Zeitbudgets. Die Hauptabweichung bestand darin, dass weniger Zeit in automatisierte Tests investiert wurde als ursprünglich geplant. Dies war möglich, da die Kernfunktionen bereits während der Entwicklung schrittweise manuell getestet wurden. Die gewonnene Zeit wurde stattdessen in zusätzliche Features wie den Letterboxd-CSV-Import, die Streaming-Anbieter-Anzeige nach Region und die Schauspieler- beziehungsweise Regisseurfilmografien investiert. Das Musiktracking über Spotify wurde als Datenbankschema vorbereitet, jedoch nicht vollständig in die Benutzeroberfläche integriert, da der Umfang den zeitlichen Rahmen überschritten hätte. Näheres kann im Anhang unter 8.2 Tabellarische Auflistung der Phasen inkl. Soll-Ist-Vergleich eingesehen werden.

## 7 Reflexion

Das Projekt Takip war ein lehrreicher Einblick in die moderne Webentwicklung und API-Integration. Die Arbeit mit Next.js 16 und dem App Router erforderte ein tiefes Verständnis für das Zusammenspiel von Server- und Client-Komponenten, insbesondere bei der Verwendung von Server Actions für Datenmutationen. Die größte Herausforderung bestand in der Gestaltung eines effizienten Caching-Systems, das sowohl die externen API-Aufrufe als auch die Datenbankabfragen optimierte, ohne dabei die Aktualität der angezeigten Daten zu beeinträchtigen. Die Entscheidung, Metadaten in der eigenen Datenbank zwischenzuspeichern, anstatt sie bei jedem Seitenaufruf erneut von der TMDB-API abzurufen, erwies sich als richtig, führte jedoch zu erhöhtem Aufwand bei der Sicherstellung der Datenkonsistenz.

Die Integration von NextAuth v5 stellte insofern eine Herausforderung dar, als die Bibliothek sich im Beta-Stadium befand und die Dokumentation teilweise unvollständig war. Der Umgang mit TypeScript und Drizzle ORM erwies sich als produktiv, da Typfehler bereits zur Kompilierzeit erkannt wurden und das automatische Generieren von Migrationen den manuellen Aufwand bei Schemaänderungen minimierte.

In Zukunft könnten mögliche Erweiterungen wie ein kollaboratives Filtersystem hinzukommen, das die Empfehlungen durch den Vergleich mit ähnlichen Nutzerprofilen verbessert. Außerdem wäre die Integration von End-to-End-Tests mit einem Framework wie Playwright empfehlenswert, da das manuelle Testen aller Funktionen zeitaufwändig und fehleranfällig war. Es wurde keine Caching-Datenbank wie Redis erstellt, da für das Schulprojekt das Next.js-eigene Caching über die fetch-Option ausreichend war.

Ich bin froh, dass ich mir dieses Projekt ausgesucht habe, weil es genau die Themen beinhaltet, die mich interessieren: API-Integration, Datenbankdesign, Authentifizierung und die Entwicklung einer visuell ansprechenden Benutzeroberfläche. Die Erfahrung, mit einem aktuellen Full-Stack-Framework zu arbeiten, war zudem sehr lehrreich. Die größte Herausforderung war allerdings das Erstellen der Projektdokumentation und das Einhalten der Zeitplanung. Dennoch war das Projekt insgesamt erfolgreich und hat die gesetzten Ziele erreicht.
