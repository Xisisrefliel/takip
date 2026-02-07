# Projektdokumentation: Takip – Media Tracking Application

---

## 1 Ausgangssituation

### 1.1 Projektidee

Bestehende Plattformen wie Letterboxd oder IMDb bieten zwar Teilfunktionen zur Verwaltung konsumierter Medieninhalte, jedoch fehlt eine einheitliche Lösung, die Filme, Serien und Bücher in einer modernen Webanwendung zusammenführt. Die Idee des Schulprojekts ist es, eine Full-Stack-Webanwendung zu entwickeln, mit der Nutzer ihre Medienbibliothek digital verwalten, bewerten und personalisierte Empfehlungen erhalten können. Der Name "Takip" stammt aus dem Türkischen und bedeutet "Verfolgung" beziehungsweise "Nachverfolgung", was den Kernzweck der Anwendung beschreibt.

Das Anwendungsfalldiagramm, welches im Anhang zu finden ist, zeigt die zentralen Use Cases der Anwendung. Der Nutzer kann Medieninhalte suchen, als gesehen, gemerkt oder favorisiert markieren und Bewertungen mit einer Fünf-Sterne-Skala abgeben. Die Discover-Seite ermöglicht eine gefilterte Medienentdeckung. Das Empfehlungssystem generiert als Akteur automatisch personalisierte Vorschläge auf Basis der bisherigen Bewertungen und Vorlieben. Über die Statistikseite werden aggregierte Daten zu den Sehgewohnheiten visualisiert. Die Verwaltung der Benutzerkonten erfolgt über eine E-Mail- und Passwort-basierte Authentifizierung.

## 2 Projektbeschreibung

### 2.1 Zielsetzung

Das Ziel des Projekts war es, innerhalb von 50 Schulstunden eine funktionsfähige Webanwendung zu entwickeln. Diese soll es Nutzern ermöglichen, Filme, Serien und Bücher als "gesehen", "gemerkt" oder "favorisiert" zu markieren und diese Informationen in einem persönlichen Profil zusammenzufassen. Darüber hinaus wurde ein Bewertungssystem mit einer Fünf-Sterne-Skala implementiert, über das Nutzer ihre Meinung zu einzelnen Titeln festhalten können. Ein weiteres Ziel war die Integration eines Empfehlungssystems, das auf Grundlage der bisherigen Bewertungen personalisierte Vorschläge generiert. Die Benutzeroberfläche sollte modern, responsiv und visuell ansprechend gestaltet werden. Schließlich sollte die Anwendung eine Statistikseite bieten, die dem Nutzer aggregierte Daten über seine Sehgewohnheiten in Form von Diagrammen und Kennzahlen darstellt.

## 3 Projektplanung

### 3.1 Projektmanagement

Das Projekt wurde inkrementell umgesetzt. Zunächst wurde eine Anforderungsanalyse durchgeführt, in der die Kernfunktionalitäten definiert wurden: Nutzerverwaltung, Medienverwaltung mit Such- und Filterfunktionen, Bewertungssystem und Statistikauswertung. Anschließend wurde die technische Architektur festgelegt. Die Entwicklung folgte einem schrittweisen Ansatz, bei dem zunächst die Datenbankstruktur und Authentifizierung implementiert wurden, bevor die einzelnen Feature-Bereiche hinzugefügt wurden. Für die Versionsverwaltung wurde Git eingesetzt, wodurch alle Änderungen nachvollziehbar dokumentiert werden konnten.

### 3.2 Technologien

Als Framework kam Next.js 16 mit React 19 und dem App Router zum Einsatz. Die Laufzeitumgebung wurde mit Bun realisiert. Für die Datenbank wurde PostgreSQL über den Serverless-Dienst Neon eingesetzt, als ORM kam Drizzle ORM zum Einsatz. Die Authentifizierung wurde mit NextAuth v5 (Auth.js) umgesetzt. Das Styling erfolgte mit Tailwind CSS v4, ergänzt durch Framer Motion für Animationen. Für die externen Mediendaten wurden die TMDB-REST-API (Filme und Serien) sowie die Hardcover-GraphQL-API (Bücher) integriert. Die Diagramme auf der Statistikseite wurden mit Recharts realisiert. Zur Speicherung sensibler Zugangsdaten wurde eine .env-Konfigurationsdatei erstellt.

### 3.3 Methoden und Artefakte

Die Projektdokumentation wurde durch verschiedene UML-Diagramme ergänzt, die den Systemaufbau und die Prozessabläufe visualisieren.

#### 3.3.1 Klassendiagramm

Das Klassendiagramm, hinterlegt im Anhang, bildet die zentrale Datenstruktur der Anwendung ab. Die Klasse "User" stellt den Benutzer dar mit Attributen wie E-Mail-Adresse, gehashtem Passwort und bevorzugter Region. Die Klasse "UserMovie" modelliert die Beziehung zwischen Nutzer und Film beziehungsweise Serie, wobei neben den Statusfeldern "watched", "liked" und "watchlist" auch zwischengespeicherte Metadaten wie Titel, Jahr, Genres, Besetzung und Filmteam enthalten sind. Die Klasse "Review" bildet das Bewertungssystem ab und enthält eine Sternebewertung von eins bis fünf sowie einen optionalen Freitextkommentar. Die Klasse "UserStats" speichert aggregierte Statistikdaten in JSONB-Spalten. Eine weitere Klasse "UserRecommendations" enthält vorberechnete Empfehlungslisten, unterteilt in die Kategorien "Personalisiert", "Erkundung" und "Geheimtipps".

![Klassendiagramm](diagrams/klassendiagramm.png)

*Abbildung 1: Klassendiagramm der zentralen Datenmodelle*

#### 3.3.2 Sequenzdiagramm

Das Sequenzdiagramm, dargestellt im Anhang, beschreibt den Ablauf, wenn ein Nutzer einen Film als "gesehen" markiert. Der Nutzer klickt auf die entsprechende Schaltfläche, woraufhin die Server Action "toggleWatchedAction" aufgerufen wird. Diese überprüft zunächst die Sitzung über die Authentifizierungsbibliothek. Nach erfolgreicher Autorisierung wird ein Datenbankeintrag in der Tabelle "user_movies" erstellt oder aktualisiert. Dabei werden die Metadaten des Films über die TMDB-API abgerufen und zwischengespeichert. Abschließend wird der Statistik-Cache invalidiert und der Profil-Pfad revalidiert, sodass die Änderung sofort sichtbar wird.

![Sequenzdiagramm](diagrams/sequenzdiagramm.png)

*Abbildung 2: Sequenzdiagramm -- Film als gesehen markieren*

#### 3.3.3 Aktivitätsdiagramm

Das Aktivitätsdiagramm beschreibt den Prozess der Medien-Entdeckung über die Discover-Seite. Der Ablauf beginnt damit, dass der Nutzer die Seite öffnet und optional Filter wie Genre, Streaming-Anbieter, Bewertung oder Laufzeit konfiguriert. Die Filterparameter werden in TMDB-kompatible Anfrageparameter umgewandelt. Anschließend wird eine Anfrage an die TMDB-API gesendet, deren Ergebnisse mit dem Nutzerstatus aus der Datenbank angereichert werden. Bei jedem Ergebnis wird angezeigt, ob der Nutzer den Titel bereits gesehen, gemerkt oder favorisiert hat.

![Aktivitätsdiagramm](diagrams/aktivitaetsdiagramm.png)

*Abbildung 3: Aktivitätsdiagramm -- Medien-Entdeckung*

## 4 Projektdurchführung

### 4.1 Aufbau bzw. Konfiguration

Die Projektstruktur wurde gemäß den Konventionen des Next.js App Router organisiert. Das Verzeichnis "src/app" enthielt alle Seiten und API-Routen, wobei dynamische Routen über das Muster "[mediaType]/[id]" realisiert wurden. Die Komponenten befanden sich in "src/components", die Datenbankdefinitionen in "src/db" und die externen API-Clients in "src/lib". Die Datenbankverbindung erfolgte über den Neon Serverless HTTP-Client. Die Drizzle-Konfiguration verwies auf das Schema in "src/db/schema.ts" und legte das Migrationsverzeichnis fest.

#### 4.1.1 TMDB-API-Integration

Die initiale Herangehensweise an die TMDB-Integration verwendete einfache fetch-Aufrufe ohne Caching, was zu langsamen Ladezeiten und häufigen API-Rate-Limit-Überschreitungen führte. Um dies zu beheben, wurde ein dedizierter Client mit einer generischen Hilfsfunktion "fetchTMDB" implementiert, die ein mehrstufiges Caching-System bereitstellte: Trending-Daten eine Stunde, Suchergebnisse fünf Minuten, Detailseiten 24 Stunden und Streaming-Anbieter zwölf Stunden. Die Bildpfade wurden über vordefinierte Größenkonstanten in vollständige URLs umgewandelt, und Genre-IDs über eine lokale Mapping-Tabelle in lesbare Namen übersetzt.

#### 4.1.2 Authentifizierung mit NextAuth v5

Bei der Integration von NextAuth v5 stellte sich heraus, dass die Bibliothek sich im Beta-Stadium befand und die Dokumentation teilweise unvollständig war. Die Konfiguration der JWT-Callbacks erforderte mehrere Iterationen, bis die Benutzer-ID und die bevorzugte Region korrekt im Token und in der Sitzung verfügbar waren. Die Passwörter wurden mit bcryptjs mit zehn Hashing-Runden gesichert. Der Drizzle Adapter stellte die Verbindung zwischen NextAuth und der PostgreSQL-Datenbank her.

### 4.2 Implementierung

#### 4.2.1 Server Actions und Datenmutationen

Alle Datenmutationen wurden als Server Actions in der Datei "src/app/actions.ts" implementiert, gekennzeichnet mit der Direktive "use server". Die zentralen Aktionen umfassten das Umschalten des Gesehen-, Watchlist- und Favoriten-Status, das Erstellen von Bewertungen, die Nutzerregistrierung sowie den Datenimport aus CSV-Dateien im Letterboxd-Format. Bei jedem Statuswechsel eines Films wurden automatisch die Metadaten von der TMDB-API abgerufen und in der Tabelle "user_movies" zwischengespeichert, um die Anzahl der API-Aufrufe zu reduzieren und die Ladezeiten des Nutzerprofils zu verbessern.

#### 4.2.2 Empfehlungssystem

Die erste Version des Empfehlungssystems verwendete einen einfachen Ansatz, bei dem lediglich ähnliche Filme zum zuletzt geschauten Titel vorgeschlagen wurden. Dies war jedoch nicht praktikabel, da die Empfehlungen zu wenig Variation boten. Stattdessen wurde ein inhaltsbasierter Filteransatz implementiert, der die favorisierten Filme des Nutzers analysiert und die fünf am häufigsten vorkommenden Genres extrahiert. Das System bietet nun drei Empfehlungskategorien: "Personalisiert" basierend auf Genrepräferenzen, "Erkundung" mit Titeln aus weniger vertrauten Genres und "Geheimtipps" mit kritisch gelobten, aber weniger populären Filmen. Die vorberechneten Empfehlungen werden in der Datenbank zwischengespeichert und bei Änderungen am Nutzerprofil als veraltet markiert.

#### 4.2.3 Benutzeroberfläche

Die Startseite zeigt ein Hero-Banner mit einem zufälligen Trending-Film sowie horizontale Karussells für Kategorien wie Trending, Beliebt und Aktuell im Kino. Die Profilseite bietet drei Tabs für gesehene Filme, die Watchlist und Favoriten. Die Discover-Seite stellt eine umfangreiche Filterfunktion mit acht Filtertypen bereit. Auf mobilen Geräten werden die Filter in einem Drawer-Menü dargestellt. Die Statistikseite verwendet Recharts für die Visualisierung von Daten wie Filme nach Jahr, Genre-Verteilung und Bewertungshistogramm.

#### 4.2.4 Datenbankoptimierung

Ein anfängliches Problem bestand darin, dass bei gleichzeitigen Statusänderungen Race Conditions auftraten, die zu inkonsistenten Datenbankeinträgen führten. Dieses Problem wurde durch die Verwendung von Upsert-Operationen mit Drizzle ORM gelöst. Für die Performanceoptimierung wurden zusammengesetzte Indizes auf häufig abgefragte Spaltenkombinationen wie "userId" und "watched" angelegt, was die Abfragezeiten insbesondere bei der Profil- und Statistikseite erheblich verbesserte.

## 5 Test und Optimierung

Während der Entwicklung wurden die Funktionen kontinuierlich manuell getestet. Ein besonderer Schwerpunkt lag auf der korrekten Synchronisation zwischen dem Nutzerstatus in der Datenbank und der Darstellung in der Benutzeroberfläche. Ein weiteres Optimierungsfeld betraf die Ladezeiten der Startseite. Durch die parallele Ausführung der API-Aufrufe für Trending, Popular und Now Playing sowie die Implementierung des mehrstufigen Caching-Systems konnte die initiale Ladezeit deutlich reduziert werden. Die Bildoptimierung wurde über die Next.js Image-Komponente mit automatischer Formatkonvertierung zu AVIF und WebP sowie einer 30-tägigen Cache-Dauer realisiert. Der React Compiler wurde aktiviert, um automatische Memoization zu ermöglichen und unnötige Re-Renders zu vermeiden. Die ESLint-Konfiguration wurde mit den Next.js-spezifischen Regeln eingerichtet und vor jedem Commit ausgeführt, um die Codequalität sicherzustellen. Das Testergebnis bestätigte die zuverlässige Funktionalität der Anwendung und zeigte, dass alle Kernfunktionen korrekt arbeiteten.

## 6 Projektabschluss

### 6.1 Soll-Ist-Vergleich

Die wesentlichen Projektziele wurden vollständig erreicht. Die Anwendung bietet eine funktionsfähige Medienverwaltung mit Authentifizierung, Bewertungen, Empfehlungen und Statistiken. Die Hauptabweichung bestand darin, dass weniger Zeit in automatisierte Tests investiert wurde als ursprünglich geplant. Dies war möglich, da die Kernfunktionen bereits während der Entwicklung schrittweise manuell getestet wurden. Die gewonnene Zeit wurde stattdessen in zusätzliche Features wie den Letterboxd-CSV-Import, die Streaming-Anbieter-Anzeige nach Region und die Schauspieler- beziehungsweise Regisseurfilmografien investiert. Das Musiktracking über Spotify wurde als Datenbankschema vorbereitet, jedoch nicht vollständig in die Benutzeroberfläche integriert, da der Umfang den zeitlichen Rahmen überschritten hätte.

## 7 Reflexion

Das Projekt Takip war ein lehrreicher Einblick in die moderne Webentwicklung und API-Integration. Die Arbeit mit Next.js 16 und dem App Router erforderte ein tiefes Verständnis für das Zusammenspiel von Server- und Client-Komponenten. Die größte Herausforderung bestand in der Gestaltung eines effizienten Caching-Systems, das sowohl die externen API-Aufrufe als auch die Datenbankabfragen optimierte, ohne dabei die Aktualität der angezeigten Daten zu beeinträchtigen. Die Entscheidung, Metadaten in der eigenen Datenbank zwischenzuspeichern, erwies sich als richtig, führte jedoch zu erhöhtem Aufwand bei der Datenkonsistenz.

In Zukunft könnten mögliche Erweiterungen wie ein kollaboratives Filtersystem hinzukommen, das die Empfehlungen durch den Vergleich mit ähnlichen Nutzerprofilen verbessert. Außerdem wäre die Integration von End-to-End-Tests mit einem Framework wie Playwright empfehlenswert, da das manuelle Testen aller Funktionen zeitaufwändig und fehleranfällig war.

Ich bin froh, dass ich mir dieses Projekt ausgesucht habe, weil es genau die Themen beinhaltet, die mich interessieren: API-Integration, Datenbankdesign, Authentifizierung und die Entwicklung einer visuell ansprechenden Benutzeroberfläche. Dennoch war das Projekt insgesamt erfolgreich und hat die gesetzten Ziele erreicht.
