# SITEAO OpsTracker frontend

React frontend for SITEAO inventory and borrowing operations.

## Stack

- React 19, TypeScript, and Vite
- Tailwind CSS v4 and shadcn/ui
- React Router and Axios
- TanStack Table and Chart.js foundations

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `VITE_API_BASE_URL` to the Express API root, including `/api`.
4. Start the backend, then run `npm run dev`.

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

The API client normalizes a missing `/api` suffix, rejects malformed base URLs, sends the
HTTP-only refresh-token cookie with requests, and holds the access token in memory.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```

## Architecture

- `src/components/common` contains layout, navigation, theme, and shared presentation components.
- `src/components/states` contains reusable loading and error states.
- `src/context` and `src/hooks` contain authentication and theme state.
- `src/layouts` contains public and role-aware authenticated shells.
- `src/pages` contains route-level pages and intentionally deferred module placeholders.
- `src/routes` contains public-only, protected, and role-restricted route guards.
- `src/services` contains the centralized Axios client and domain service boundaries.
