"use client";

import { useEffect, useRef, useState } from "react";

export default function PresentationPage() {
  const [isReady, setIsReady] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide the navbar and reset main container styles for fullscreen presentation
    const navbar = document.querySelector("nav")?.parentElement?.parentElement;
    const main = document.querySelector("main");

    if (navbar) {
      (navbar as HTMLElement).style.display = "none";
    }
    if (main) {
      main.style.padding = "0";
      main.style.paddingTop = "0";
      main.style.width = "100vw";
      main.style.maxWidth = "100vw";
      main.style.minHeight = "100vh";
      main.style.margin = "0";
    }

    // Load Reveal.js CSS
    const revealCss = document.createElement("link");
    revealCss.rel = "stylesheet";
    revealCss.href = "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css";
    document.head.appendChild(revealCss);

    const themeCss = document.createElement("link");
    themeCss.rel = "stylesheet";
    themeCss.href = "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css";
    document.head.appendChild(themeCss);

    // Load Reveal.js
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js";
    script.onload = () => {
      // @ts-expect-error Reveal is loaded globally
      if (window.Reveal && revealRef.current) {
        // @ts-expect-error Reveal is loaded globally
        window.Reveal.initialize({
          hash: true,
          slideNumber: true,
          transition: "slide",
          backgroundTransition: "fade",
          width: 1920,
          height: 1080,
          margin: 0.04,
          minScale: 0.2,
          maxScale: 2.0,
        });
        setIsReady(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (navbar) {
        (navbar as HTMLElement).style.display = "";
      }
      if (main) {
        main.style.padding = "";
        main.style.paddingTop = "";
        main.style.width = "";
        main.style.maxWidth = "";
        main.style.minHeight = "";
        main.style.margin = "";
      }
      // @ts-expect-error Reveal cleanup
      if (window.Reveal) {
        // @ts-expect-error Reveal cleanup
        window.Reveal.destroy?.();
      }
    };
  }, []);

  return (
    <>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        .reveal-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0a0a0a;
        }

        .reveal {
          width: 100%;
          height: 100%;
        }

        .reveal .slides {
          text-align: center;
        }

        .reveal h1 {
          font-size: 2.5em;
          font-weight: 700;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .reveal h2 {
          font-size: 1.6em;
          font-weight: 600;
          color: #60a5fa;
        }

        .reveal h3 {
          font-size: 1.2em;
          font-weight: 500;
          color: #a78bfa;
        }

        .reveal .subtitle {
          font-size: 1.2em;
          color: #a1a1aa;
          margin-top: 0.5em;
        }

        .reveal ul, .reveal ol {
          text-align: left;
          display: block;
        }

        .reveal li {
          margin-bottom: 0.4em;
          line-height: 1.4;
        }

        .reveal .highlight {
          color: #60a5fa;
          font-weight: 500;
        }

        .reveal .accent {
          color: #a78bfa;
        }

        .reveal .warning {
          color: #fbbf24;
        }

        .reveal .success {
          color: #34d399;
        }

        .reveal table {
          margin: 0 auto;
          border-collapse: collapse;
          font-size: 0.7em;
        }

        .reveal table th {
          background: #1e3a5f;
          color: #60a5fa;
          padding: 0.5em 1em;
          border: 1px solid #374151;
        }

        .reveal table td {
          background: #1a1a2e;
          padding: 0.5em 1em;
          border: 1px solid #374151;
        }

        .reveal .architecture-box {
          background: #1a1a2e;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 1em;
          font-family: 'Fira Code', monospace;
          font-size: 0.55em;
          text-align: left;
          line-height: 1.5;
        }

        .reveal .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1em;
          text-align: left;
        }

        .reveal .feature-card {
          background: linear-gradient(135deg, #1a1a2e, #0f172a);
          border: 1px solid #374151;
          border-radius: 12px;
          padding: 1em;
        }

        .reveal .feature-card h3 {
          margin-top: 0;
          margin-bottom: 0.5em;
          font-size: 1em;
        }

        .reveal .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5em;
          text-align: left;
        }

        .reveal .stats-preview {
          background: linear-gradient(135deg, #1e1b4b, #0f172a);
          border-radius: 16px;
          padding: 1em;
          border: 1px solid #4c1d95;
        }

        .reveal code {
          background: #1e293b;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.85em;
        }

        .reveal .slide-number {
          background: #1a1a2e !important;
          color: #60a5fa !important;
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .reveal .progress {
          background: #1a1a2e;
          height: 4px;
        }

        .reveal .progress span {
          background: linear-gradient(90deg, #60a5fa, #a78bfa);
        }

        .question-mark {
          font-size: 4em;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-text {
          font-size: 3.5em !important;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
          font-size: 1.5em;
          z-index: 9999;
        }
      `}</style>

      {!isReady && (
        <div className="loading-screen">
          Loading presentation...
        </div>
      )}

      <div className="reveal-container">
        <div className="reveal" ref={revealRef}>
          <div className="slides">
            {/* Slide 1: Title */}
            <section data-background="#0a0a0a">
              <h1 className="logo-text">Takip</h1>
              <p className="subtitle">
                Die intelligente Media-Tracking App
              </p>
              <p style={{ fontSize: "0.8em", color: "#71717a", marginTop: "1.5em" }}>
                Filme, Serien & Bücher verfolgen, entdecken, analysieren
              </p>
              <p style={{ fontSize: "0.6em", color: "#52525b", marginTop: "2em" }}>
                Omer | Januar 2026
              </p>
            </section>

            {/* Slide 2: Agenda */}
            <section data-background="#0a0a0a">
              <h2>Gliederung</h2>
              <ol style={{ fontSize: "0.85em", lineHeight: "1.8" }}>
                <li>Motivation & Problemstellung</li>
                <li>Lösung: Takip Kernfunktionen</li>
                <li>Feature Highlights</li>
                <li>Technische Architektur</li>
                <li>Tech Stack & Datenbank</li>
                <li>Live Demo / Screenshots</li>
                <li>Zusammenfassung & Ausblick</li>
              </ol>
            </section>

            {/* Slide 3: Motivation */}
            <section data-background="#0a0a0a">
              <h2>Motivation & Problemstellung</h2>
              <div className="two-column">
                <div>
                  <h3>Das Problem</h3>
                  <ul style={{ fontSize: "0.75em" }}>
                    <li>
                      <span className="warning">Streaming-Überfluss:</span><br />
                      Netflix, Prime, Disney+, Apple TV+...
                    </li>
                    <li>&quot;Was habe ich eigentlich schon gesehen?&quot;</li>
                    <li>&quot;Wo kann ich diesen Film streamen?&quot;</li>
                    <li>Keine zentrale Übersicht</li>
                    <li>Empfehlungen nur plattformbasiert</li>
                  </ul>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="question-mark">?</div>
                </div>
              </div>
              <p style={{ marginTop: "1em", fontSize: "1em" }}>
                <span className="highlight">Die Frage:</span> Wie behalte ich den Überblick?
              </p>
            </section>

            {/* Slide 4: Core Functions */}
            <section data-background="#0a0a0a">
              <h2>Lösung: Takip Kernfunktionen</h2>
              <div className="feature-grid">
                <div className="feature-card">
                  <h3>📋 Tracking System</h3>
                  <ul style={{ fontSize: "0.65em" }}>
                    <li>Gesehen markieren (Filme, Serien, Bücher)</li>
                    <li>Watchlist für &quot;später schauen&quot;</li>
                    <li>Favoriten markieren</li>
                  </ul>
                </div>
                <div className="feature-card">
                  <h3>📺 Streaming-Finder</h3>
                  <ul style={{ fontSize: "0.65em" }}>
                    <li>Zeigt wo Inhalte verfügbar sind</li>
                    <li>140+ Länder/Regionen</li>
                    <li>Direktlinks zu Anbietern</li>
                  </ul>
                </div>
                <div className="feature-card">
                  <h3>🔍 Entdecken</h3>
                  <ul style={{ fontSize: "0.65em" }}>
                    <li>Trending & Neu im Kino</li>
                    <li>Kommende Filme</li>
                    <li>Erweiterte Filter</li>
                  </ul>
                </div>
                <div className="feature-card">
                  <h3>⭐ Bewertungen</h3>
                  <ul style={{ fontSize: "0.65em" }}>
                    <li>1-5 Sterne Rating</li>
                    <li>Text-Reviews</li>
                    <li>Persönliche Historie</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Slide 5: Hidden Gems */}
            <section data-background="#0a0a0a">
              <h2>Feature: Hidden Gems & Discovery</h2>
              <div className="two-column">
                <div>
                  <h3>💎 Hidden Gems Algorithmus</h3>
                  <ul style={{ fontSize: "0.75em" }}>
                    <li>
                      <span className="success">Kritisch gelobt:</span> Rating 7-9
                    </li>
                    <li>
                      <span className="accent">Wenig bekannt:</span> 100-1000 Votes
                    </li>
                    <li>Qualität abseits des Mainstreams</li>
                  </ul>
                </div>
                <div>
                  <h3>🎯 Erweiterte Suche</h3>
                  <ul style={{ fontSize: "0.75em" }}>
                    <li>Multi-Filter: Genre, Rating, Laufzeit</li>
                    <li>Streaming nach Region</li>
                    <li>Sortierung nach Beliebtheit, Datum</li>
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: "1em", padding: "0.8em", background: "#1a1a2e", borderRadius: "12px", fontSize: "0.7em" }}>
                <span className="highlight">Beispiel:</span> Finde italienische Thriller aus den 70ern,
                die auf MUBI verfügbar sind und mindestens 7.5 Rating haben
              </div>
            </section>

            {/* Slide 6: Statistics */}
            <section data-background="#0a0a0a">
              <h2>Feature: Persönliche Statistiken</h2>
              <div className="two-column">
                <div>
                  <h3>📊 &quot;Cinematic Fingerprint&quot;</h3>
                  <ul style={{ fontSize: "0.75em" }}>
                    <li>Gesamtstunden geschaut</li>
                    <li>Genre-Verteilung</li>
                    <li>Filme nach Jahr</li>
                    <li>Dekaden-Affinität (80er, 90er...)</li>
                    <li>Top Schauspieler & Regisseure</li>
                    <li>Rating-Verteilung</li>
                  </ul>
                </div>
                <div className="stats-preview">
                  <div style={{ textAlign: "center", fontSize: "0.65em", color: "#a1a1aa" }}>
                    <div style={{ fontSize: "2em", fontWeight: "bold", color: "#60a5fa" }}>247</div>
                    <div>Filme gesehen</div>
                    <div style={{ marginTop: "0.8em", fontSize: "1.5em", fontWeight: "bold", color: "#a78bfa" }}>412h</div>
                    <div>Gesamtzeit</div>
                    <div style={{ marginTop: "0.8em" }}>
                      <span style={{ color: "#34d399" }}>Drama 34%</span> •
                      <span style={{ color: "#fbbf24" }}> Thriller 28%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Slide 7: TV Tracking */}
            <section data-background="#0a0a0a">
              <h2>Feature: TV-Serien Tracking</h2>
              <div style={{ textAlign: "center" }}>
                <h3>📺 Episoden-Tracking</h3>
              </div>
              <div className="feature-grid" style={{ marginTop: "0.8em" }}>
                <div className="feature-card">
                  <ul style={{ fontSize: "0.7em" }}>
                    <li>Einzelne Episoden markieren</li>
                    <li>Staffel-Übersicht</li>
                    <li>Fortschrittsanzeige</li>
                  </ul>
                </div>
                <div className="feature-card">
                  <ul style={{ fontSize: "0.7em" }}>
                    <li>Reviews pro Episode</li>
                    <li>Nächste Episode finden</li>
                    <li>Serien-Statistiken</li>
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: "1em", padding: "0.8em", background: "#1a1a2e", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1em", fontSize: "0.7em" }}>
                  <span>Breaking Bad</span>
                  <div style={{ flex: 1, height: "8px", background: "#374151", borderRadius: "4px" }}>
                    <div style={{ width: "75%", height: "100%", background: "linear-gradient(90deg, #60a5fa, #a78bfa)", borderRadius: "4px" }}></div>
                  </div>
                  <span className="success">47/62 Episoden</span>
                </div>
              </div>
            </section>

            {/* Slide 8: Architecture */}
            <section data-background="#0a0a0a">
              <h2>Technische Architektur</h2>
              <div className="architecture-box">
                <pre style={{ margin: 0, fontSize: "1em" }}>{`┌─────────────────────────────────────────────────────┐
│                     Frontend                        │
│          Next.js 16 (App Router) + React 19         │
│             Tailwind CSS + Framer Motion            │
├─────────────────────────────────────────────────────┤
│                   Server Actions                    │
│            (Mutations, Auth, API Calls)             │
├─────────────────────────────────────────────────────┤
│    PostgreSQL (Neon)     │     External APIs        │
│       Drizzle ORM        │    TMDB, Hardcover       │
└─────────────────────────────────────────────────────┘`}</pre>
              </div>
              <div style={{ marginTop: "0.8em", fontSize: "0.65em" }}>
                <span className="highlight">Caching:</span> Trending 1h • Discovery 4h • Details 24h • Metadaten in DB
              </div>
            </section>

            {/* Slide 9: Tech Stack */}
            <section data-background="#0a0a0a">
              <h2>Tech Stack Übersicht</h2>
              <table>
                <thead>
                  <tr>
                    <th>Kategorie</th>
                    <th>Technologie</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Runtime</td>
                    <td><span className="highlight">Bun</span></td>
                  </tr>
                  <tr>
                    <td>Framework</td>
                    <td><span className="highlight">Next.js 16</span>, React 19</td>
                  </tr>
                  <tr>
                    <td>Datenbank</td>
                    <td>PostgreSQL (<span className="accent">Neon Serverless</span>)</td>
                  </tr>
                  <tr>
                    <td>ORM</td>
                    <td><span className="highlight">Drizzle ORM</span></td>
                  </tr>
                  <tr>
                    <td>Auth</td>
                    <td>NextAuth v5 (JWT)</td>
                  </tr>
                  <tr>
                    <td>Styling</td>
                    <td>Tailwind CSS v4</td>
                  </tr>
                  <tr>
                    <td>Animation</td>
                    <td><span className="accent">Framer Motion</span></td>
                  </tr>
                  <tr>
                    <td>APIs</td>
                    <td>TMDB, Hardcover GraphQL</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Slide 10: Database Schema */}
            <section data-background="#0a0a0a">
              <h2>Datenbank Schema</h2>
              <div className="two-column">
                <div>
                  <h3>Kern-Tabellen</h3>
                  <ul style={{ fontSize: "0.7em" }}>
                    <li><code>users</code> - Benutzer + Präferenzen</li>
                    <li><code>userMovies</code> - Film/Serien-Tracking</li>
                    <li><code>userBooks</code> - Bücher-Tracking</li>
                    <li><code>userEpisodes</code> - Episoden</li>
                    <li><code>reviews</code> - Bewertungen</li>
                    <li><code>userStats</code> - Statistiken (JSONB)</li>
                  </ul>
                </div>
                <div>
                  <h3>Performance</h3>
                  <ul style={{ fontSize: "0.7em" }}>
                    <li><span className="success">Indizes</span> auf häufige Queries</li>
                    <li><span className="highlight">JSONB</span> für flexible Analytics</li>
                    <li><span className="accent">Batch-Ops</span> gegen N+1</li>
                    <li>Metadaten <span className="success">gecached</span></li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Slide 11: API Integrations */}
            <section data-background="#0a0a0a">
              <h2>API Integrationen</h2>
              <div className="two-column">
                <div className="feature-card">
                  <h3>🎬 TMDB</h3>
                  <ul style={{ fontSize: "0.7em" }}>
                    <li>Filme & Serien Daten</li>
                    <li>Cast, Crew, Keywords</li>
                    <li>Streaming-Verfügbarkeit</li>
                    <li>Empfehlungen</li>
                  </ul>
                </div>
                <div className="feature-card">
                  <h3>📚 Hardcover</h3>
                  <ul style={{ fontSize: "0.7em" }}>
                    <li>Bücher via GraphQL</li>
                    <li>Autoren & Cover</li>
                    <li>Beschreibungen</li>
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: "1em", padding: "0.8em", background: "#1a1a2e", borderRadius: "12px", fontSize: "0.7em" }}>
                <span className="highlight">Smart Caching:</span> Metadaten einmal abrufen → in DB speichern → API-Calls reduziert
              </div>
            </section>

            {/* Slide 12: Summary */}
            <section data-background="#0a0a0a">
              <h2>Zusammenfassung & Ausblick</h2>
              <div className="two-column">
                <div>
                  <h3 className="success">Was Takip bietet</h3>
                  <ul style={{ fontSize: "0.75em" }}>
                    <li>Zentrale Übersicht für alle Medien</li>
                    <li>Intelligente Entdeckung</li>
                    <li>Persönliche Statistiken</li>
                    <li>Multi-Region Streaming-Finder</li>
                  </ul>
                </div>
                <div>
                  <h3 className="accent">Ausblick</h3>
                  <ul style={{ fontSize: "0.75em" }}>
                    <li>Mobile App</li>
                    <li>Social Features</li>
                    <li>AI-basierte Empfehlungen</li>
                    <li>Spotify Integration</li>
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: "1.5em", fontSize: "1.3em" }}>
                <span className="highlight">Fragen?</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
