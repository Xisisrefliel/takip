# Takip

<div align="center">
  <img src="./public/screenshot.png" alt="Takip App Screenshot" width="100%">
</div>

## Overview

**Takip** is a modern, minimalist media tracking application that helps you discover, track, and organize everything you watch and read. Built with Next.js 16 and powered by real-time data from TMDB and Hardcover, Takip offers a beautiful, intuitive interface for managing your entertainment journey.

### Why Takip?

- **Smart Recommendations**: Get personalized suggestions based on your watch history, with mood-based discovery and hidden gems tailored to your taste
- **Unified Experience**: Track movies, TV series, and books all in one place
- **Beautiful Design**: A distinctive, polished interface that breaks away from generic aesthetics
- **Lightning Fast**: Server-side rendering and intelligent caching ensure instant page loads
- **Privacy First**: Self-hosted with your own database - your data stays yours

## Key Features

### 🎬 Comprehensive Tracking
- Mark movies, TV shows, and books as watched, liked, or add to watchlist
- Track individual TV episodes
- Write and share reviews with 1-5 star ratings
- View detailed statistics about your watching habits

### 🎯 Personalized Discovery
- **Mood-Based Recommendations**: Find content matching your current mood (uplifting, mind-bending, dark-intense, and more)
- **Hidden Gems**: Discover critically acclaimed but lesser-known titles
- **Genre Exploration**: Smart suggestions based on your preferences
- **Trending & Popular**: Stay up-to-date with what's hot right now

### 📊 Rich Statistics
- Track total movies, series, and books completed
- View your most-watched genres, favorite directors, and top actors
- Analyze your watching patterns over time
- Celebrate milestones and achievements

### 🔍 Powerful Search
- Fast, real-time search across movies, TV series, and books
- Filter by media type with instant results
- Detailed information pages with cast, crew, and metadata

## How It Works

1. **Sign Up**: Create your free account in seconds
2. **Start Tracking**: Search for movies, shows, or books and mark them as watched, liked, or add to your watchlist
3. **Rate & Review**: Share your thoughts with star ratings and written reviews
4. **Get Recommendations**: The more you track, the better your personalized recommendations become
5. **Explore**: Discover new content through mood-based suggestions, trending lists, and hidden gems

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Runtime**: Bun
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth v5 (Auth.js)
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **APIs**: TMDB (movies/TV), Hardcover (books)

## Getting Started

### Prerequisites

- Bun installed on your system
- PostgreSQL database (we recommend [Neon](https://neon.tech) for serverless PostgreSQL)
- API keys for TMDB and Hardcover

### Environment Setup

Create a `.env.local` file in the root directory with the following environment variables:

```env
# TMDB API Configuration (required for movie/TV data)
# Get your free API key from: https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here

# Hardcover API Configuration (required for book data)
# Get your API key from: https://hardcover.app/developers
HARDCOVER_API_KEY=your_hardcover_api_key_here

# NextAuth Configuration (required for authentication)
AUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Database Configuration (required for data persistence)
DATABASE_URL=your_database_url_here
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/takip.git
cd takip
```

2. Install dependencies:
```bash
bun install
```

3. Run database migrations:
```bash
bun run db:migrate
```

4. Start the development server:
```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

```bash
bun dev              # Start development server
bun build            # Production build
bun lint             # Run ESLint
bun db:generate      # Generate Drizzle migrations
bun db:migrate       # Apply migrations to database
```

## Project Structure

```
takip/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/       # React components
│   ├── lib/              # External API clients (TMDB, Hardcover) and utilities
│   ├── db/               # Drizzle schema and database connection
│   ├── types/            # TypeScript type definitions
│   └── context/          # React context providers
├── public/               # Static assets
└── drizzle/              # Database migrations
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Movie and TV data provided by [TMDB](https://www.themoviedb.org/)
- Book data provided by [Hardcover](https://hardcover.app/)
- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
