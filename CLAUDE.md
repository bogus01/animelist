# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build (TypeScript compile + Vite)
npm run preview  # Preview production build
```

No linting or test runner is configured.

## Database access (read first)

Avant toute opération Supabase, lire [AI_AGENT_RULES.md](AI_AGENT_RULES.md). En résumé : **utilisez `SUPABASE_DB_URL` du `.env.local` via une connexion PostgreSQL directe**, pas le MCP Supabase ni `supabase link`. Les Classic Tokens sont défaillants dans la configuration multi-comptes de l'utilisateur.

## Environment

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

`GEMINI_API_KEY` in the README is stale — the app does not use Gemini.

## Architecture

Single-page React 19 app with no router. Navigation is handled by a `currentView` state in `App.tsx` with four views: `home`, `search`, `my-list`, `details`.

**All UI components live in `App.tsx`** — there is no `components/` folder. The file contains: `NavButton`, `AnimeCard`, `AnimeCarousel`, `AnimeDetailsView`, and the root `App` component.

### Data flow

```
AniList GraphQL API ──► aniListService.ts ──► App.tsx state
                                                    │
                                              userData (favorites,
                                             statuses, watched eps)
                                                    │
                                    ┌───────────────┴──────────────┐
                                    │                              │
                              localStorage                  Supabase
                            (immediate write)          kvStorageService.ts
```

`userData` is always written to `localStorage` synchronously, then synced to Supabase asynchronously. On mount, Supabase is the primary source; `localStorage` is the fallback for first-time users, which then gets synced up.

### Services

- **`services/aniListService.ts`** — All AniList GraphQL queries. Uses the public endpoint `https://graphql.anilist.co` (no API key required). Two distinct queries: `ANIME_QUERY` (full fields, used for search and detail) and `ANIME_BY_IDS_QUERY` (lighter, used for bulk list loading).
- **`services/kvStorageService.ts`** — `KVStorageService` class wrapping Supabase. Stores all user data as a single JSONB blob per user in the `animelist_user_data` table, keyed by `user_id`. The name "KV" is a legacy of the original Vercel KV implementation.
- **`services/supabaseClient.ts`** — Supabase client singleton.

### User identity

No authentication system. A random `userId` (`user_XXXXXXXXX`) is generated on first visit and persisted in `localStorage` under `ani_user_id`.

### Key types (`types.ts`)

- `Anime` — AniList media object with titles, cover images, episodes, relations, etc.
- `UserData` — `{ animeStatuses, favoriteIds, watchedEpisodes }` — the entire persisted state.
- `WatchStatus` — enum: `Plan to Watch`, `In Progress`, `Completed`.

### Note on dependencies

`@vercel/kv` is still listed in `package.json` but is no longer used — the app was migrated to Supabase. It can be safely removed.
