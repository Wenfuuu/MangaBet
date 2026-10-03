# MangaBet

A manga reader web app built with SvelteKit.
It proxies an upstream manga source through server-side API routes and adds reading features on top: bookmarks, reading history, offline downloads, and optional MyAnimeList sync.

## Features

- Browse latest releases and search manga
- Manga detail pages with chapter lists
- Chapter reader with continue-reading support
- Account login and registration (with captcha) against the upstream source
- Bookmarks and reading history
- Downloads page for offline reading
- Optional MyAnimeList integration:
  - OAuth login (PKCE)
  - Sync reading progress
  - Import your MAL list
  - Manually correct wrong manga-to-MAL mappings

## Tech stack

- SvelteKit 2 and Svelte 5 (runes)
- Tailwind CSS 4
- TypeScript (strict)
- Deployed on Vercel via `@sveltejs/adapter-vercel`

## Getting started

Requires Node.js and npm.

```sh
npm install
cp .env.example .env
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`).

## Environment variables

| Variable            | Required | Description                                        |
| ------------------- | -------- | -------------------------------------------------- |
| `VITE_API_URL`      | yes      | Base URL of the upstream manga source              |
| `MAL_CLIENT_ID`     | no       | MyAnimeList API client ID, needed for MAL sync     |
| `MAL_CLIENT_SECRET` | no       | MyAnimeList API client secret, needed for MAL sync |

The app throws on startup if `VITE_API_URL` is missing.

### MyAnimeList setup

1. Create a client at <https://myanimelist.net/apiconfig>.
2. Set App Type to `web`.
3. Set Redirect URL to `https://<your-domain>/api/mal/callback` (or `http://localhost:5173/api/mal/callback` for local dev).
4. Put the client ID and secret in `.env`.

## Scripts

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start the dev server         |
| `npm run build`        | Production build             |
| `npm run preview`      | Preview the production build |
| `npm run check`        | Type-check with svelte-check |
| `npm run lint`         | Check formatting (Prettier)  |
| `npm run format`       | Format with Prettier         |

## Project structure

```
src/
├── types/           domain types (manga, chapter, reader)
├── lib/
│   ├── components/  presentational UI components
│   ├── services/    data fetching, called from server code only
│   └── api.ts       upstream endpoint URLs and client-side storage helpers
└── routes/
    ├── api/         server endpoints (proxy, auth, bookmarks, MAL)
    └── ...          pages (home, latest, search, manga, bookmark, downloads)
```

See [CLAUDE.md](CLAUDE.md) for the layer conventions in more detail.

## Contributing

Issues and pull requests are welcome.
Open an issue first for larger changes so we can agree on the approach.

## Disclaimer

MangaBet does not host any manga content.
All content is served by a third-party source configured through `VITE_API_URL`.
